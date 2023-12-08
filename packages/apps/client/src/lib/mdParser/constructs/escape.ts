import { NodeConstruct, ParserState } from '..'

export function escape(): NodeConstruct {
	function escapeChar(_: string, state: ParserState) {
		state.dataStore['inEscape'] = true
	}

	function passthroughChar(_: string, state: ParserState) {
		if (state.dataStore['inEscape'] !== true) return
		state.dataStore['inEscape'] = false
		return true
	}

	return {
		name: 'escape',
		char: {
			'\\': escapeChar,
			any: passthroughChar,
		},
	}
}
