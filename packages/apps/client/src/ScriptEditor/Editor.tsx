import React, { useEffect, useRef } from 'react'
import { undo, redo, history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { baseKeymap } from 'prosemirror-commands'
import { schema } from './scriptSchema'
import 'prosemirror-view/style/prosemirror.css'
import { updateModel } from './plugins/updateModel'
import { readOnlyNodeFilter } from './plugins/readOnlyNodeFilter'
import { randomId } from '../lib/lib'
import { formatingKeymap } from './keymaps'
import { deselectAll } from './commands/deselectAll'
import { fromMarkdown } from '../lib/prosemirrorDoc'

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
	const editorState = useRef<EditorState>()

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
		const test = 'Raz dwa trzy **cztery pięć** sześć. ABC :reverse[Siedem osiem] dziewięć.'
		const data = fromMarkdown(test)
		console.log(data)
	}, [])

	useEffect(() => {
		if (!containerEl.current) return

		const rundown = schema.node(schema.nodes.rundown, undefined, [
			schema.node(schema.nodes.rundownTitle, undefined, schema.text('Rundown Title')),
			schema.node(schema.nodes.segment, undefined, [
				schema.node(schema.nodes.segmentTitle, undefined, schema.text('Segment Title')),
				schema.node(
					schema.nodes.line,
					{
						lineId: randomId(),
					},
					[
						schema.node(schema.nodes.lineTitle, undefined, schema.text('Line title')),
						schema.node(schema.nodes.paragraph, undefined, schema.text('Script...')),
					]
				),
				schema.node(
					schema.nodes.line,
					{
						lineId: randomId(),
					},
					[
						schema.node(schema.nodes.lineTitle, undefined, schema.text('Line title')),
						schema.node(schema.nodes.paragraph, undefined, schema.text('Script...')),
					]
				),
				schema.node(
					schema.nodes.line,
					{
						lineId: randomId(),
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
				updateModel(console.log),
			],
			doc,
		})
		const view = new EditorView(containerEl.current, {
			state,
		})

		editorView.current = view
		editorState.current = state

		return () => {
			view.destroy()
		}
	}, [])

	return <div ref={containerEl} className={className} spellCheck="false"></div>
}

type OnChangeEvent = {
	value: string
}
