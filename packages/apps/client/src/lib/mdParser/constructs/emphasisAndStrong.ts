import { NodeConstruct, ParserState } from '..'
import { EmphasisNode, StrongNode } from '../astNodes'

export function emphasisAndStrong(): NodeConstruct {
	function emphasisOrStrong(char: string, state: ParserState) {
		if (state.nodeCursor === null) throw new Error('cursor === null assertion')
		if ((state.nodeCursor.type === 'emphasis' || state.nodeCursor.type === 'strong') && 'code' in state.nodeCursor) {
			if (state.nodeCursor.code === char) {
				if (state.peek() === char) {
					state.consume()
				}

				state.flushBuffer()
				state.popNode()
				return false
			}
		}

		state.flushBuffer()

		let type: 'emphasis' | 'strong' = 'emphasis'

		if (state.peek() === char) {
			type = 'strong'
			state.consume()
		}

		const emphasisOrStrongNode: EmphasisNode | StrongNode = {
			type,
			children: [],
			code: char,
		}
		state.pushNode(emphasisOrStrongNode)

		return false
	}

	return {
		name: 'emphasisOrStrong',
		char: {
			'*': emphasisOrStrong,
			_: emphasisOrStrong,
		},
	}
}
