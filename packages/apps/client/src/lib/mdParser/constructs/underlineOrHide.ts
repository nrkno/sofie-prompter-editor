import { NodeConstruct, ParserState, CharHandlerResult } from '../parserState'
import { HiddenNode, UnderlineNode } from '../astNodes'

export function underlineOrHide(): NodeConstruct {
	function underlineOrHide(char: string, state: ParserState): CharHandlerResult | void {
		if (state.nodeCursor === null) throw new Error('cursor === null assertion')

		let len = 1
		let peeked = state.peek(len)
		while (peeked && peeked.length === len && peeked.slice(-1) === char) {
			len++
			peeked = state.peek(len)
		}

		switch (len) {
			case 2:
				return underline(char, state)
			case 1:
				return hide(char, state)
			default:
				return
		}
	}

	return {
		name: 'underline',
		char: {
			'|': underlineOrHide,
			$: underlineOrHide,
		},
	}
}

function hide(char: string, state: ParserState): CharHandlerResult | void {
	if (state.nodeCursor === null) throw new Error('cursor === null assertion')

	// consume once
	// char += state.consume()

	if (state.nodeCursor.type === 'hidden' && 'code' in state.nodeCursor && state.nodeCursor.code === char) {
		state.flushBuffer()
		state.popNode()
		return CharHandlerResult.StopProcessingNoBuffer
	}

	state.flushBuffer()

	const type = 'hidden'

	const underlineNode: HiddenNode = {
		type,
		children: [],
		code: char,
	}
	state.pushNode(underlineNode)

	return CharHandlerResult.StopProcessingNoBuffer
}

function underline(char: string, state: ParserState): CharHandlerResult | void {
	if (state.nodeCursor === null) throw new Error('cursor === null assertion')

	// consume twice
	char += state.consume()
	// char += state.consume()

	if (state.nodeCursor.type === 'underline' && 'code' in state.nodeCursor && state.nodeCursor.code === char) {
		state.flushBuffer()
		state.popNode()
		return CharHandlerResult.StopProcessingNoBuffer
	}

	state.flushBuffer()

	const type = 'underline'

	const underlineNode: UnderlineNode = {
		type,
		children: [],
		code: char,
	}
	state.pushNode(underlineNode)

	return CharHandlerResult.StopProcessingNoBuffer
}
