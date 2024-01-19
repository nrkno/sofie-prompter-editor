import { Command } from 'prosemirror-state'
import { toggleMark } from 'prosemirror-commands'
import { schema } from './scriptSchema'

export const formatingKeymap: Record<string, Command> = {
	'Mod-b': toggleMark(schema.marks.bold),
	'Mod-i': toggleMark(schema.marks.italic),
	'Mod-u': toggleMark(schema.marks.underline),
	'Mod-q': toggleMark(schema.marks.reverse),
	'Mod-F10': toggleMark(schema.marks.hidden),
}
