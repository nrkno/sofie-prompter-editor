import { Plugin } from 'prosemirror-state'

export function updateModel() {
	return new Plugin({
		appendTransaction: (_tr, _oldState, newState) => {
			console.log(newState.doc.toJSON())
			return null
		},
	})
}
