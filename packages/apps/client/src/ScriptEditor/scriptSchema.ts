import { Schema } from 'prosemirror-model'
import { nodes } from 'prosemirror-schema-basic'

export const schema = new Schema({
	nodes: {
		text: nodes.text,

		paragraph: nodes.paragraph,

		lineTitle: {
			group: 'title',
			content: 'text*',
			atom: true,
			marks: '',
			isolating: true,
			draggable: false,
			selectable: false,
			locked: true,
			toDOM() {
				return ['h3', { class: 'LineSlug', contenteditable: 'false' }, 0]
			},
		},
		line: {
			group: 'block',
			content: 'lineTitle paragraph*',
			attrs: {
				lineId: {
					default: null,
				},
			},
			isolating: true,
			draggable: false,
			selectable: false,
			toDOM() {
				return ['div', { class: 'Line' }, 0]
			},
		},

		segmentTitle: {
			group: 'title',
			content: 'text*',
			atom: true,
			isolating: true,
			draggable: false,
			selectable: false,
			locked: true,
			marks: '',
			toDOM() {
				return ['h2', { class: 'SegmentTitle', contenteditable: 'false' }, 0]
			},
		},
		segment: {
			group: 'block',
			content: 'segmentTitle line*',
			isolating: true,
			draggable: false,
			selectable: false,
			toDOM() {
				return ['div', { class: 'Segment' }, 0]
			},
		},

		rundownTitle: {
			group: 'title',
			content: 'text*',
			atom: true,
			isolating: true,
			draggable: false,
			selectable: false,
			locked: true,
			marks: '',
			toDOM() {
				return ['h1', { class: 'RundownTitle', contenteditable: 'false' }, 0]
			},
		},
		rundown: {
			group: 'block',
			content: 'rundownTitle segment*',
			isolating: true,
			draggable: false,
			selectable: false,
			toDOM() {
				return ['div', { class: 'Rundown' }, 0]
			},
		},

		doc: { content: 'rundown*' },
	},
	marks: {
		bold: {
			toDOM() {
				return ['b', 0]
			},
		},
		italic: {
			toDOM() {
				return ['i', 0]
			},
		},
		underline: {
			toDOM() {
				return ['u', 0]
			},
		},
		hidden: {
			toDOM() {
				return ['s', 0]
			},
		},
		reverse: {
			toDOM() {
				return ['rev', 0]
			},
		},
	},
})
