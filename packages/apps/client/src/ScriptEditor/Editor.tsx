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

const LOREM_IPSUM =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sollicitudin ipsum at lacinia sodales. *Sed* in **pharetra _mauris_**, id facilisis nibh. Curabitur eget erat bibendum, aliquam ligula ac, interdum orci. Curabitur non mollis nibh. Pellentesque ultrices suscipit diam ac fermentum. Morbi id velit consectetur, auctor ligula scelerisque, vulputate ante. Nunc mattis consectetur eleifend. Aenean vestibulum porta mollis. Cras ultrices facilisis turpis, et vulputate felis tempor at. Aliquam ultricies commodo odio at vehicula. Curabitur lobortis lectus at lacus commodo tincidunt. Donec vulputate urna efficitur, vehicula urna vel, porttitor urna.\n' +
	'Duis congue molestie neque, et sollicitudin lacus porta eget. *Etiam* massa dui, cursus vitae lacus sit **amet**, aliquet bibendum elit. Morbi tincidunt quis metus ut luctus. Proin tincidunt suscipit vestibulum. In eu cursus quam. Praesent lacus mauris, euismod nec lacus in, tincidunt ultrices justo. Sed ac rhoncus quam. Praesent libero elit, convallis ut urna nec, interdum elementum diam. Pellentesque aliquet, mi vitae faucibus euismod, mauris lorem auctor felis, tincidunt bibendum erat nisl in nisi.\n' +
	'Donec ac rhoncus ex. Pellentesque eleifend ante id maximus *mollis*. Duis in mauris vel ligula venenatis gravida.\n\n\\*Mauris blandit arcu a lorem cursus ornare. Vestibulum at ligula vel nisi eleifend pretium. Vivamus et nunc scelerisque, suscipit dolor nec, ornare elit. Nam ut tristique est. Suspendisse sollicitudin tortor quam, eget cursus quam porttitor nec. Fusce convallis libero massa, a consequat tortor accumsan id. Pellentesque at diam sit amet tortor suscipit bibendum sed et elit. Etiam ac tellus tellus. Cras pulvinar sem et augue consequat mattis. \n' +
	'Duis mollis ut enim vitae lobortis. ~Nulla mi libero~, blandit sit amet congue eu, vehicula vel sem. Donec maximus lacus \\~ac nisi blandit sodales. Fusce sed lectus iaculis, tempus quam lacinia, gravida velit. In imperdiet, sem sit amet commodo eleifend, turpis tellus lobortis metus, et rutrum mi sapien vel nisl. Pellentesque at est non tortor efficitur tincidunt vitae in ex. In gravida pulvinar ligula eget pellentesque. Nullam viverra orci velit, at dictum diam imperdiet sit amet. Morbi consequat est vitae mi consequat fringilla. Phasellus pharetra turpis nulla, at molestie nunc hendrerit ut. \n' +
	'Aenean ut nulla ut diam imperdiet laoreet sed sed enim. **Vivamus bibendum** tempus metus ac consectetur. Aliquam ut nisl sed mauris sodales dignissim. Integer consectetur sapien quam, sit amet blandit quam cursus ac. Quisque vel convallis erat. Aliquam ac interdum nisi. Praesent id sapien vitae sem venenatis sollicitudin. '

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
						schema.node(schema.nodes.lineTitle, undefined, [schema.text('Line title')]),
						...fromMarkdown(
							'Raz _dwa **trzy**_. ~Cztery.~\n\nPięć _sześć_ siedem.\nRaz\n\n\n\nSome more ~Markdown **Here**~'
						),
					]
				),
				schema.node(
					schema.nodes.line,
					{
						lineId: randomId(),
					},
					[schema.node(schema.nodes.lineTitle, undefined, schema.text('Line title')), ...fromMarkdown(LOREM_IPSUM)]
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
