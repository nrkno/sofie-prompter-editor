import { Schema } from 'prosemirror-model'
import { nodes } from 'prosemirror-schema-basic'

export const schema = new Schema({
	nodes: {
		unmarkedText: {
			inline: true,
			marks: '',
		},
		text: nodes.text,
		paragraph: nodes.paragraph,
		segmentHeading: {
			group: 'block',
			content: 'unmarkedText',
			atom: true,
		},
		partHeading: {
			group: 'block',
			content: 'unmarkedText',
			atom: true,
		},
		rundownHeading: {
			group: 'block',
			content: 'unmarkedText',
			atom: true,
		},
		doc: { content: 'block*' },
	},
	marks: {
		bold: {},
		italic: {},
		underline: {},
		hidden: {},
		reverse: {},
	},
})
