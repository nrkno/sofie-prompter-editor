import { Plugin } from 'prosemirror-state'
import { UILineId } from '../../model/UILine'
import { Node } from 'prosemirror-model'
import { AddMarkStep, RemoveMarkStep, StepMap } from 'prosemirror-transform'
import { schema } from '../scriptSchema'

export const EXTERNAL_STATE_CHANGE = 'externalStateChange'

export function updateModel(onChange?: (lineId: UILineId, lineNodes: Node[]) => void) {
	return new Plugin({
		appendTransaction: (trs, oldState, newState) => {
			const anyChanges = trs.reduce<boolean>((memo, tr) => memo || tr.docChanged, false)
			if (!anyChanges) return null

			for (const tr of trs) {
				if (tr.getMeta(EXTERNAL_STATE_CHANGE)) return
				for (const step of tr.steps) {
					let stepMap = step.getMap()
					// For some reason AddMarkStep/RemoveMarkStep don't provide a map. Generate it manually
					if (step instanceof AddMarkStep || step instanceof RemoveMarkStep) {
						stepMap = new StepMap([step.from, step.to - step.from, step.to - step.from])
					}

					stepMap.forEach((oldStart, oldEnd, newStart, newEnd) => {
						oldState.doc.nodesBetween(oldStart, oldEnd, (_node, _pos, parent) => {
							if (!parent) return
							if (parent.type.name !== 'line') return

							const lineId = parent.attrs['lineId'] as UILineId

							newState.doc.nodesBetween(newStart, newEnd, (_node, _pos, parent) => {
								if (!parent) return
								if (parent.type.name !== 'line') return

								const allNodes: Node[] = []
								parent.content.forEach((node) => {
									if (node.type === schema.nodes.lineTitle) return
									allNodes.push(node)
								})
								// console.log(allNodes)
								if (onChange) onChange(lineId, allNodes)
							})
						})
					})
				}
			}

			return null
		},
	})
}
