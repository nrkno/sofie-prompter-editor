import { NodeConstruct, ParserState, CharHandlerResult } from '../parserState'
import { EmphasisNode, StrongNode, Node, ParentNodeBase } from '../astNodes'

export function emphasisAndStrong(): NodeConstruct {
	function emphasisOrStrong(char: string, state: ParserState): CharHandlerResult | void {
		if (state.nodeCursor === null) throw new Error('cursor === null assertion')
		if (state.nodeCursor && isEmphasisOrStrongNode(state.nodeCursor)) {
			if (state.nodeCursor.code.startsWith(char)) {
				if (state.peek() === char) {
					state.consume()
				}

				state.flushBuffer()
				state.popNode()
				return CharHandlerResult.StopProcessingNoBuffer
			}
		}

		state.flushBuffer()

		let type: 'emphasis' | 'strong' = 'emphasis'

		if (state.peek() === char) {
			type = 'strong'
			char += state.consume()
		}

		const emphasisOrStrongNode: EmphasisNode | StrongNode = {
			type,
			children: [],
			code: char,
		}
		state.pushNode(emphasisOrStrongNode)

		return CharHandlerResult.StopProcessingNoBuffer
	}

	return {
		name: 'emphasisOrStrong',
		char: {
			'*': emphasisOrStrong,
			_: emphasisOrStrong,
		},
	}
}

function isEmphasisOrStrongNode(node: Node | ParentNodeBase): node is EmphasisNode | StrongNode {
	return node.type === 'emphasis' || node.type === 'strong'
}
