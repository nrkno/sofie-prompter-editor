import { NodeConstruct, ParserState } from '..'
import { ParagraphNode } from '../astNodes'

export function paragraph(): NodeConstruct {
	function paragraphStart(_: string, state: ParserState) {
		if (state.nodeCursor !== null) return
		const newParagraph: ParagraphNode = {
			type: 'paragraph',
			children: [],
		}
		state.replaceStack(newParagraph)
	}

	function paragraphEnd(char: string, state: ParserState) {
		if (state.nodeCursor === null) {
			paragraphStart(char, state)
		}

		state.flushBuffer()
		state.nodeCursor = null

		return false
	}

	return {
		name: 'paragraph',
		char: {
			end: paragraphEnd,
			'\n': paragraphEnd,
			any: paragraphStart,
		},
	}
}
