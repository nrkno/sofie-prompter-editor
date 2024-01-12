import React, { useCallback, useEffect, useRef } from 'react'
import { PartId } from '@sofie-prompter-editor/shared-model'
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
import { IReactionDisposer, reaction } from 'mobx'

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

	const updateLineScript = useCallback((lineId: PartId, script: string | null) => {
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

		if (beginOffset < editorState.selection.head && endOffset > editorState.selection.head) {
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
				console.log(performance.mark('begin'))
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
									reaction(
										() => lines.reactiveObj.script,
										(script) => {
											updateLineScript(lines.id, script)
										},
										{
											fireImmediately: false,
										}
									)
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

				console.log(performance.mark('createDoc'))
				const doc = schema.node(schema.nodes.doc, undefined, [rundown])

				console.log(performance.mark('updateState'))
				editorView.current.updateState(makeNewEditorState(doc))

				console.log(performance.mark('finished'))
			},
			{
				delay: 250,
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
				scrollContainerWithCaret(containerEl.current, 'up')
				break
			case 'ArrowDown':
				scrollContainerWithCaret(containerEl.current, 'down')
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

function scrollContainerWithCaret(container: HTMLElement, upOrDown: 'up' | 'down') {
	const backwardsForwards = upOrDown === 'down' ? 'forward' : 'backward'
	const currentSelection = window.getSelection()
	if (!currentSelection) return
	const bounds = currentSelection.getRangeAt(0).getBoundingClientRect()
	currentSelection.modify('move', backwardsForwards, 'line')
	const modifiedSelection = window.getSelection()
	if (!modifiedSelection) return
	const modifiedBounds = modifiedSelection.getRangeAt(0).getBoundingClientRect()
	let scrollAmount = modifiedBounds.top - bounds.top
	if (scrollAmount === 0) {
		if (modifiedBounds.left !== bounds.left) {
			scrollAmount = modifiedBounds.left < bounds.left ? -19 : 19
		}
	}

	console.log(scrollAmount, bounds, modifiedBounds)

	container.scrollBy({
		top: scrollAmount,
		behavior: 'instant',
	})
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
