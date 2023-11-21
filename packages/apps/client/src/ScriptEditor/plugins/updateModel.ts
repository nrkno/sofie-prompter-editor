import { Plugin } from 'prosemirror-state'

export function updateModel() {
	return new Plugin({
		appendTransaction: () => {
			// console.log(newState)
			return null
		},
	})
}
