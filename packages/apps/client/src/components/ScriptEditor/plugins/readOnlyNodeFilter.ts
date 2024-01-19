import { Plugin } from 'prosemirror-state'

export function readOnlyNodeFilter() {
	return new Plugin({
		filterTransaction: (tr, state): boolean => {
			if (!tr.docChanged) return true

			let editAllowed = true
			for (const step of tr.steps) {
				step.getMap().forEach((oldStart, oldEnd) => {
					state.doc.nodesBetween(oldStart, oldEnd, (node, _index, parent) => {
						if (node.type.spec.locked || parent?.type.spec.locked) {
							editAllowed = false
						}
					})
				})
			}

			return editAllowed
		},
	})
}
