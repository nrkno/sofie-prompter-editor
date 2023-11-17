import React, { useEffect, useRef } from 'react'
import { undo, redo, history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { baseKeymap } from 'prosemirror-commands'
import { schema } from './scriptSchema'
import 'prosemirror-view/style/prosemirror.css'
import { updateModel } from './plugins/updateModel'

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

	useEffect(() => {
		if (!containerEl.current) return

		const state = EditorState.create({
			schema,
			plugins: [history(), keymap({ 'Mod-z': undo, 'Mod-y': redo }), keymap(baseKeymap), updateModel()],
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

	return <div ref={containerEl} className={className}></div>
}

type OnChangeEvent = {
	value: string
}
