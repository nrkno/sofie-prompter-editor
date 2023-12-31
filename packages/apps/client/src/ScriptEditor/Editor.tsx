import React, { useCallback, useEffect, useRef } from 'react'
import { undo, redo, history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { EditorState, SelectionBookmark } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Fragment, Node, Slice } from 'prosemirror-model'
import { baseKeymap } from 'prosemirror-commands'
import { replaceStep } from 'prosemirror-transform'
import { schema } from './scriptSchema'
import 'prosemirror-view/style/prosemirror.css'
import { EXTERNAL_STATE_CHANGE, updateModel } from './plugins/updateModel'
import { readOnlyNodeFilter } from './plugins/readOnlyNodeFilter'
import { formatingKeymap } from './keymaps'
import { deselectAll } from './commands/deselectAll'
import { fromMarkdown } from '../lib/prosemirrorDoc'
import { AppStore } from '../stores/AppStore'
import { UILineId } from '../model/UILine'
import { IReactionDisposer, autorun, reaction } from 'mobx'

export function Editor({
	className,
}: {
	className?: string
	onChange?: (e: OnChangeEvent) => void
}): React.JSX.Element {
	const containerEl = useRef<HTMLDivElement>(null)
	const editorView = useRef<EditorView>()

	useEffect(() => {
		if (!containerEl.current) return

		const doc = schema.node(schema.nodes.doc, undefined, [])

		const state = makeNewEditorState(doc)
		const view = new EditorView(containerEl.current, {
			state,
		})

		editorView.current = view

		return () => {
			view.destroy()
		}
	}, [])

	const updateLineScript = useCallback((lineId: UILineId, script: string | null) => {
		if (!editorView.current) return

		const editorState = editorView.current.state

		const line = find(editorState.doc, (node) => node.attrs['lineId'] === lineId)

		if (!line) return

		const ranges: { offset: number; size: number }[] = []

		line.node.forEach((node, offset) => {
			if (node.type !== schema.nodes.paragraph) return
			ranges.push({ offset, size: node.nodeSize })
		})
		ranges.sort((a, b) => a.offset - b.offset)

		let beginOffset: number = line.node.nodeSize - 1
		let endOffset: number = beginOffset

		if (ranges.length !== 0) {
			beginOffset = line.pos + 1 + ranges[0].offset
			endOffset = line.pos + 1 + ranges[ranges.length - 1].offset + ranges[ranges.length - 1].size
		}

		let selectionBookmark: SelectionBookmark | undefined

		const fragment = Fragment.fromArray([...fromMarkdown(script)])

		const top = getSelectionTopOffset()

		if (beginOffset < editorState.selection.$head.pos && endOffset > editorState.selection.$head.pos) {
			// TODO: Handle a heuristic for keeping the caret at the very end of the Segment script
			selectionBookmark = preserveSelection(editorState)
			selectionBookmark = selectionBookmark.map({
				map: (pos) => {
					return Math.min(pos, beginOffset + fragment.size - 1)
				},
				mapResult: (pos) => {
					return {
						pos: Math.min(pos, beginOffset + fragment.size - 1),
						deleted: false,
						deletedAcross: false,
						deletedAfter: false,
						deletedBefore: false,
					}
				},
			})
		}

		const step = replaceStep(editorState.doc, beginOffset, endOffset, Slice.maxOpen(fragment))
		if (!step) return

		const tr = editorState.tr.step(step)
		tr.setMeta(EXTERNAL_STATE_CHANGE, true)
		let newState = editorState.apply(tr)

		if (selectionBookmark) newState = restoreSelection(newState, selectionBookmark)

		editorView.current.updateState(newState)

		if (top && containerEl.current) restoreSelectionTopOffset(top, containerEl.current)
	}, [])

	useEffect(() => {
		const lineReactionDisposers: IReactionDisposer[] = []

		const mainDisposer = reaction(
			() => {
				const openRundown = AppStore.rundownStore.openRundown

				if (!openRundown) return null

				return {
					name: openRundown.name,
					segmentsInOrder: openRundown.segmentsInOrder.map((segment) => ({
						id: segment.id,
						name: segment.name,
						linesInOrder: segment.linesInOrder.map((line) => ({
							id: line.id,
							slug: line.slug,
							reactiveObj: line,
						})),
					})),
				}
			},
			(data) => {
				lineReactionDisposers.forEach((destr) => destr())

				const openRundown = AppStore.rundownStore.openRundown

				if (!data || !editorView.current || !openRundown) return

				const rundown = schema.node(schema.nodes.rundown, undefined, [
					schema.node(schema.nodes.rundownTitle, undefined, schema.text(data.name)),
					...data.segmentsInOrder.map((segment) =>
						schema.node(schema.nodes.segment, undefined, [
							schema.node(schema.nodes.segmentTitle, undefined, schema.text(segment.name)),
							...segment.linesInOrder.map((lines) => {
								lineReactionDisposers.push(
									autorun(() => {
										updateLineScript(lines.id, lines.reactiveObj.script)
									})
								)

								return schema.node(
									schema.nodes.line,
									{
										lineId: lines.id,
									},
									[
										schema.node(schema.nodes.lineTitle, undefined, [schema.text(lines.slug)]),
										...fromMarkdown(lines.reactiveObj.script),
									]
								)
							}),
						])
					),
				])

				const doc = schema.node(schema.nodes.doc, undefined, [rundown])

				editorView.current.updateState(makeNewEditorState(doc))
			},
			{
				fireImmediately: true,
			}
		)

		return () => {
			mainDisposer()
			lineReactionDisposers.forEach((destr) => destr())
		}
	}, [updateLineScript])

	function onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
		if (!containerEl.current) return
		if (!(!e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey)) return

		switch (e.code) {
			case 'ArrowUp':
				window.getSelection()?.modify('move', 'backward', 'line')
				containerEl.current.scrollBy({
					top: -1 * getLineHeight(),
					behavior: 'instant',
				})
				break
			case 'ArrowDown':
				window.getSelection()?.modify('move', 'forward', 'line')
				containerEl.current.scrollBy({
					top: getLineHeight(),
					behavior: 'instant',
				})
				break
		}
	}

	return <div ref={containerEl} className={className} spellCheck="false" onKeyDown={onKeyDown}></div>
}

function makeNewEditorState(doc: Node): EditorState {
	return EditorState.create({
		plugins: [
			history(),
			keymap({ 'Mod-z': undo, 'Mod-y': redo }),
			keymap({ Escape: deselectAll }),
			keymap(formatingKeymap),
			keymap(baseKeymap),
			readOnlyNodeFilter(),
			updateModel((lineId, change) => console.log(lineId, change)),
		],
		doc,
	})
}

function getLineHeight(): number {
	return 21
}

function restoreSelectionTopOffset(top: number, overflowEl: HTMLElement) {
	const afterUpdateTop = getSelectionTopOffset()
	if (afterUpdateTop) {
		const diff = afterUpdateTop - top
		if (overflowEl && diff) {
			const el = overflowEl
			el.scrollBy({
				top: diff,
				behavior: 'instant',
			})
		}
	}
}

function getSelectionTopOffset(): number | undefined {
	const selection = document.getSelection()
	if (!selection) return
	const el = nearestElement(selection.focusNode)
	if (!el) return
	const rect = el.getBoundingClientRect()
	return rect.top
}

function preserveSelection(state: EditorState): SelectionBookmark {
	return state.selection.getBookmark()
}

function restoreSelection(state: EditorState, preservedSelection: SelectionBookmark): EditorState {
	const restoreSelectionTr = state.tr.setSelection(preservedSelection.resolve(state.doc))
	return state.apply(restoreSelectionTr)
}

function nearestElement(node: globalThis.Node | null): HTMLElement | null {
	return node?.parentElement ?? null
}

function find(
	node: Node,
	predicate: (needle: Node, offset: number, index: number) => boolean
): undefined | NodeWithPosition {
	let found: NodeWithPosition | undefined = undefined
	node.descendants((maybeNode, pos, _, index) => {
		if (found) return
		const isOK = predicate(maybeNode, pos, index)
		if (isOK) found = { node: maybeNode, pos }
	})

	return found
}

type NodeWithPosition = {
	node: Node
	pos: number
}

type OnChangeEvent = {
	value: string
}
