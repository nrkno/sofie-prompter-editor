import React, { useEffect, useRef } from 'react'
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
import { randomId } from '../lib/lib'
import { formatingKeymap } from './keymaps'
import { deselectAll } from './commands/deselectAll'
import { fromMarkdown } from '../lib/prosemirrorDoc'

const LOREM_IPSUM =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sollicitudin ipsum at lacinia sodales. *Sed* in **pharetra _mauris_**, id facilisis nibh. Curabitur eget erat bibendum, aliquam ligula ac, interdum orci. Curabitur non mollis nibh. Pellentesque ultrices suscipit diam ac fermentum. Morbi id velit consectetur, auctor ligula scelerisque, vulputate ante. Nunc mattis consectetur eleifend. Aenean vestibulum porta mollis. Cras ultrices facilisis turpis, et vulputate felis tempor at. Aliquam ultricies commodo odio at vehicula. Curabitur lobortis lectus at lacus commodo tincidunt. Donec vulputate urna efficitur, vehicula urna vel, porttitor urna.\n' +
	'Duis congue molestie neque, et sollicitudin lacus porta eget. *Etiam* massa dui, cursus vitae lacus sit **amet**, aliquet bibendum elit. Morbi tincidunt quis metus ut luctus. Proin tincidunt suscipit vestibulum. In eu cursus quam. Praesent lacus mauris, euismod nec lacus in, tincidunt ultrices justo. Sed ac rhoncus quam. Praesent libero elit, convallis ut urna nec, interdum elementum diam. Pellentesque aliquet, mi vitae faucibus euismod, mauris lorem auctor felis, tincidunt bibendum erat nisl in nisi.\n' +
	'Donec ac rhoncus ex. Pellentesque eleifend ante id maximus *mollis*. Duis in mauris vel ligula venenatis gravida.\n\n\\*Mauris blandit arcu a lorem cursus ornare. Vestibulum at ligula vel nisi eleifend pretium. Vivamus et nunc scelerisque, suscipit dolor nec, ornare elit. Nam ut tristique est. Suspendisse sollicitudin tortor quam, eget cursus quam porttitor nec. Fusce convallis libero massa, a consequat tortor accumsan id. Pellentesque at diam sit amet tortor suscipit bibendum sed et elit. Etiam ac tellus tellus. Cras pulvinar sem et augue consequat mattis. \n' +
	'Duis mollis ut enim vitae lobortis. ~Nulla mi libero~, blandit sit amet congue eu, vehicula vel sem. Donec maximus lacus \\~ac nisi blandit sodales. Fusce sed lectus iaculis, tempus quam lacinia, gravida velit. In imperdiet, sem sit amet commodo eleifend, turpis tellus lobortis metus, et rutrum mi sapien vel nisl. Pellentesque at est non tortor efficitur tincidunt vitae in ex. In gravida pulvinar ligula eget pellentesque. Nullam viverra orci velit, at dictum diam imperdiet sit amet. Morbi consequat est vitae mi consequat fringilla. Phasellus pharetra turpis nulla, at molestie nunc hendrerit ut. \n' +
	'Aenean ut nulla ut diam imperdiet laoreet sed sed enim. **Vivamus bibendum** tempus metus ac consectetur. Aliquam ut nisl sed mauris sodales dignissim. Integer consectetur sapien quam, sit amet blandit quam cursus ac. Quisque vel convallis erat. Aliquam ac interdum nisi. Praesent id sapien vitae sem venenatis sollicitudin. '

const LINE_1_ID = randomId()
const LINE_2_ID = randomId()
const LINE_3_ID = randomId()

export function Editor({
	initialValue,
	className,
}: {
	className?: string
	initialValue?: string
	onChange?: (e: OnChangeEvent) => void
}): React.JSX.Element {
	const containerEl = useRef<HTMLDivElement>(null)
	const editorView = useRef<EditorView>()

	void initialValue

	// useEffect(() => {
	// 	function onBeforeUnload(ev: BeforeUnloadEvent) {
	// 		ev.stopPropagation()
	// 		ev.preventDefault()
	// 		return false
	// 	}

	// 	window.addEventListener('beforeunload', onBeforeUnload, { capture: true })

	// 	return () => {
	// 		window.removeEventListener('beforeunload', onBeforeUnload, { capture: true })
	// 	}
	// }, [])

	useEffect(() => {
		if (!containerEl.current) return

		const rundown = schema.node(schema.nodes.rundown, undefined, [
			schema.node(schema.nodes.rundownTitle, undefined, schema.text('Rundown Title')),
			schema.node(schema.nodes.segment, undefined, [
				schema.node(schema.nodes.segmentTitle, undefined, schema.text('Segment Title')),
				schema.node(
					schema.nodes.line,
					{
						lineId: LINE_1_ID,
					},
					[
						schema.node(schema.nodes.lineTitle, undefined, [schema.text('Line title')]),
						...fromMarkdown(
							'Raz _dwa **trzy**_. ~Cztery.~\n\nPięć _sześć_ siedem.\nRaz\n\n\n\nSome more ~Markdown **Here**~'
						),
					]
				),
				schema.node(
					schema.nodes.line,
					{
						lineId: LINE_2_ID,
					},
					[schema.node(schema.nodes.lineTitle, undefined, schema.text('Line title')), ...fromMarkdown(LOREM_IPSUM)]
				),
				schema.node(
					schema.nodes.line,
					{
						lineId: LINE_3_ID,
					},
					[
						schema.node(schema.nodes.lineTitle, undefined, schema.text('Line title')),
						schema.node(schema.nodes.paragraph, undefined, schema.text('Script...')),
					]
				),
			]),
		])
		const doc = schema.node(schema.nodes.doc, undefined, [rundown])

		const state = EditorState.create({
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
		const view = new EditorView(containerEl.current, {
			state,
		})

		editorView.current = view

		return () => {
			view.destroy()
		}
	}, [])

	useEffect(() => {
		const loop = setInterval(() => {
			if (!editorView.current) return

			const editorState = editorView.current.state

			const line = find(editorState.doc, (node) => node.attrs['lineId'] === LINE_2_ID)

			if (!line) return

			const ranges: { offset: number; size: number }[] = []

			line.node.forEach((node, offset) => {
				if (node.type !== schema.nodes.paragraph) return
				ranges.push({ offset, size: node.nodeSize })
			})
			ranges.sort((a, b) => a.offset - b.offset)
			const beginOffset = line.pos + 1 + ranges[0].offset
			const endOffset = line.pos + 1 + ranges[ranges.length - 1].offset + ranges[ranges.length - 1].size

			let selectionBookmark: SelectionBookmark | undefined

			const fragment = Fragment.fromArray([
				...fromMarkdown(
					LOREM_IPSUM.substring(0, Math.floor(LOREM_IPSUM.length * Math.random())) + `\n\n${new Date().toString()}`
				),
			])

			const top = getSelectionTop()

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

			if (top && containerEl.current) restoreSelectionTop(top, containerEl.current)
		}, 5000)

		return () => {
			clearInterval(loop)
		}
	}, [])

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

function getLineHeight(): number {
	return 21
}

function restoreSelectionTop(top: number, overflowEl: HTMLElement) {
	const afterUpdateTop = getSelectionTop()
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

function getSelectionTop(): number | undefined {
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
