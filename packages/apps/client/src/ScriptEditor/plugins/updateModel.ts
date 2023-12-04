import { Plugin } from 'prosemirror-state'
import { UILineId } from '../../model/UILine'

export function updateModel(onChange?: (lineId: UILineId, contents: SomeContents) => void) {
	return new Plugin({
		appendTransaction: (trs, oldState, newState) => {
			const anyChanges = trs.reduce<boolean>((memo, tr) => memo || tr.docChanged, false)
			if (!anyChanges) return null

			for (const tr of trs) {
				for (const step of tr.steps) {
					step.getMap().forEach((oldStart, oldEnd, newStart, newEnd) => {
						oldState.doc.nodesBetween(oldStart, oldEnd, (_node, _pos, parent) => {
							if (!parent) return
							if (parent.type.name !== 'line') return

							const lineId = parent.attrs['lineId'] as UILineId

							newState.doc.nodesBetween(newStart, newEnd, (_node, _pos, parent) => {
								if (!parent) return
								if (parent.type.name !== 'line') return

								if (onChange) onChange(lineId, parent.toString())
							})
						})
					})
				}
			}

			return null
		},
	})
}

type SomeContents = unknown
