import React, { useCallback, useEffect, useRef } from 'react'
import { PartId } from '@sofie-prompter-editor/shared-model'
import { undo, redo, history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { EditorState, Selection, SelectionBookmark, TextSelection } from 'prosemirror-state'
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
import { fromMarkdown, toMarkdown } from 'src/lib/prosemirrorDoc'
import { RootAppStore } from 'src/stores/RootAppStore'
import { IReactionDisposer, reaction } from 'mobx'
import { AnyTriggerAction } from 'src/lib/triggerActions/triggerActions'
import { findMatchingAncestor } from 'src/lib/findMatchingAncestor'
import { UILineId } from 'src/model/UILine'
import { reportCaretPosition } from './plugins/reportCaretPosition'
import { findNode, getNodeRange, nearestElement } from './lib'

export function Editor({
	className,
}: {
	className?: string
	onChange?: (e: OnChangeEvent) => void
}): React.JSX.Element {
	const containerEl = useRef<HTMLDivElement>(null)
	const editorView = useRef<EditorView>()

	const onMovePrompterToHere = useCallback(() => {
		if (!editorView.current) return

		const view = editorView.current
		const state = view.state

		const resPosAtHead = state.selection.$head
		const parentOfHead = resPosAtHead.node(resPosAtHead.depth - 1)

		const objId = parentOfHead.attrs['lineId']
		if (!objId) return

		const currentCoords = view.coordsAtPos(resPosAtHead.pos)
		const currentElement = view.domAtPos(resPosAtHead.pos).node
		const lineDiv = findMatchingAncestor(currentElement, '.Line')
		if (!lineDiv) return
		const computedStyle = getComputedStyle(lineDiv)
		const fontSizePx = parseFloat(computedStyle.fontSize)
		const lineBox = lineDiv.getBoundingClientRect()
		const offset = (currentCoords.top - lineBox.top) / fontSizePx

		RootAppStore.control.jumpToObject(objId, offset * -1)
	}, [])

	useEffect(() => {
		function onAction(action: AnyTriggerAction) {
			if (!editorView.current || !editorView.current.hasFocus()) return
			if (action.type === 'movePrompterToHere') onMovePrompterToHere()
		}

		RootAppStore.triggerStore.addListener('action', onAction)

		return () => {
			RootAppStore.triggerStore.removeListener('action', onAction)
		}
	}, [onMovePrompterToHere])

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

	useEffect(() => {
		function onScrollEditorToLine(e: { lineId: UILineId }) {
			console.log('onScrollEditorToLine', e)

			if (!editorView.current) return

			const lineId = e.lineId
			let editorState = editorView.current.state

			console.log(editorState.tr.selection, e.lineId)

			const line = findNode(editorState.doc, (node) => node.attrs['lineId'] === lineId)
			if (!line) return

			editorView.current.dom.focus()

			const { beginOffset, endOffset } = getNodeRange(line)

			const selectionAllPart = TextSelection.create(editorState.doc, beginOffset, endOffset)
			const trSelection0 = editorState.tr.setSelection(selectionAllPart).scrollIntoView()

			editorView.current.dispatch(trSelection0)

			editorState = editorView.current.state

			setTimeout(() => {
				if (!editorView.current) return

				const selectionBegin = TextSelection.create(editorState.doc, beginOffset, beginOffset)
				const trSelection1 = editorState.tr.setSelection(selectionBegin).scrollIntoView()

				editorView.current.dispatch(trSelection1)
			})
		}

		RootAppStore.uiStore.on('scrollEditorToLine', onScrollEditorToLine)

		return () => {
			RootAppStore.uiStore.removeListener('scrollEditorToLine', onScrollEditorToLine)
		}
	}, [])

	const updateLineScript = useCallback((lineId: PartId, script: string | null, _isEditable: boolean) => {
		if (!editorView.current) return

		const editorState = editorView.current.state

		const line = findNode(editorState.doc, (node) => node.attrs['lineId'] === lineId)

		if (!line) return

		const { beginOffset, endOffset } = getNodeRange(line)

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
				const openRundown = RootAppStore.rundownStore.openRundown

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
			(rundown) => {
				console.log(performance.mark('begin'))
				lineReactionDisposers.forEach((destr) => destr())

				const openRundown = RootAppStore.rundownStore.openRundown

				if (!rundown || !editorView.current || !openRundown) return

				const rundownDocument = schema.node(schema.nodes.rundown, undefined, [
					schema.node(schema.nodes.rundownTitle, undefined, schema.text(rundown.name || '\xa0')),
					...rundown.segmentsInOrder.map((segment) =>
						schema.node(schema.nodes.segment, undefined, [
							schema.node(schema.nodes.segmentTitle, undefined, schema.text(segment.name || '\xa0')),
							...segment.linesInOrder.map((lines) => {
								lineReactionDisposers.push(
									reaction(
										() => ({ script: lines.reactiveObj.script, isEditable: lines.reactiveObj.isEditable }),
										({ script, isEditable }) => {
											updateLineScript(lines.id, script, isEditable)
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
										schema.node(schema.nodes.lineTitle, undefined, [schema.text(lines.slug || '\xa0')]),
										...fromMarkdown(lines.reactiveObj.script),
									]
								)
							}),
						])
					),
				])

				console.log(performance.mark('createDoc'))
				const doc = schema.node(schema.nodes.doc, undefined, [rundownDocument])

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

	return <div ref={containerEl} className={className} spellCheck="false"></div>
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
			reportCaretPosition((lineId) => {
				const openRundown = RootAppStore.rundownStore.openRundown
				if (!openRundown) return

				openRundown.updatePartWithCaret(lineId)
			}),
			updateModel((lineId, lineNodes) => {
				// Future: debounce? locking? require manual triggering of the save?
				const openRundown = RootAppStore.rundownStore.openRundown
				if (!openRundown) return

				const compiledMarkdown = toMarkdown(lineNodes)

				// TODO - discard if readonly

				openRundown.updatePartScript(lineId, compiledMarkdown)
			}),
		],
		doc,
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

type OnChangeEvent = {
	value: string
}
