import { NodeConstruct, ParserState } from '..'
import { ReverseNode } from '../astNodes'

export function reverse(): NodeConstruct {
	function reverse(char: string, state: ParserState) {
		if (state.nodeCursor === null) throw new Error('cursor === null assertion')
		if (state.nodeCursor.type === 'reverse' && 'code' in state.nodeCursor) {
			if (state.nodeCursor.code === char) {
				state.flushBuffer()
				state.popNode()
				return false
			}
		}

		state.flushBuffer()

		const type = 'reverse'

		const reverseNode: ReverseNode = {
			type,
			children: [],
			code: char,
		}
		state.pushNode(reverseNode)

		return false
	}

	return {
		name: 'reverse',
		char: {
			'~': reverse,
		},
	}
}
