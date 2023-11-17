import React, { useEffect, useRef } from 'react'
import { schema } from 'prosemirror-schema-basic'
import { undo, redo, history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { baseKeymap } from 'prosemirror-commands'

export function Editor({
	initialValue,
}: {
	initialValue?: string
	onChange?: (e: OnChangeEvent) => void
}): React.JSX.Element {
	const containerEl = useRef<HTMLDivElement>(null)
	const editorView = useRef<EditorView>()
	const editorState = useRef<EditorState>()

	void initialValue

	useEffect(() => {
		if (!containerEl.current) return

		const state = EditorState.create({ schema })
		const view = new EditorView(containerEl.current, {
			state,
			plugins: [history(), keymap({ 'Mod-z': undo, 'Mod-y': redo }), keymap(baseKeymap)],
		})

		editorView.current = view
		editorState.current = state
	}, [])

	return <div ref={containerEl}></div>
}

type OnChangeEvent = {
	value: string
}
