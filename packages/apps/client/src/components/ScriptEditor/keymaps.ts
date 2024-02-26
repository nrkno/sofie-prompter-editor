import { Command } from 'prosemirror-state'
import { toggleMark } from 'prosemirror-commands'
import { schema } from './scriptSchema'
import { cycleColours } from './commands/cycleColours'
import { insertScreenMarker } from './commands/insertScreenMarker'

export const formatingKeymap: Record<string, Command> = {
	'Mod-b': toggleMark(schema.marks.bold),
	'Mod-i': toggleMark(schema.marks.italic),
	'Mod-u': toggleMark(schema.marks.underline),
	'Mod-r': toggleMark(schema.marks.reverse),
	'Mod-f': cycleColours(schema.marks.colour, ['red', 'yellow']),
	'Mod-F10': toggleMark(schema.marks.hidden),
	'Mod-k': insertScreenMarker(),
}
