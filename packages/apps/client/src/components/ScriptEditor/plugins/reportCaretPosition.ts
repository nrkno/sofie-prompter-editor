import { Plugin } from 'prosemirror-state'
import { findNode } from '../lib'
import { UILineId } from 'src/model/UILine'

export const EXTERNAL_STATE_CHANGE = 'externalStateChange'

export function reportCaretPosition(onChange?: (lineId: UILineId) => void) {
	return new Plugin({
		appendTransaction: (trs) => {
			for (const tr of trs) {
				const selectionHead = tr.selection.$head.pos

				const foundNode = findNode(tr.doc, (node, offset) => {
					if (node.attrs['lineId'] && offset <= selectionHead && offset + node.nodeSize >= selectionHead) {
						return true
					}

					return false
				})

				const lineId = foundNode?.node?.attrs['lineId'] as UILineId | undefined
				if (!lineId) return

				onChange?.(lineId)
			}

			return null
		},
	})
}
