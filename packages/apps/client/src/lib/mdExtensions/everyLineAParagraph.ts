import { Extension, CompileContext, Token } from 'mdast-util-from-markdown'
import { TokenTypeMap } from 'micromark-util-types'

export function everyLineAParagraph(): Extension {
	return {
		enter: {
			['lineEnding']: function (this: CompileContext, token: Token) {
				console.log(token, this)
			},
		},
	}
}
