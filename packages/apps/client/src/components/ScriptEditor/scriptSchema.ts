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
			content: 'lineTitle paragraph paragraph*',
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

		backScreenMarker: {
			group: 'inline',
			inline: true,
			toDOM() {
				// temporary icon, to be replaced with a better design after UX sessions:
				return ['span', { class: 'screen-marker' }, '❤️'] // R.I.P Harry the Dino 🦕 :( (killed by the designers who wanted something more serious)
			},
		},
	},
	marks: {
		bold: {
			toDOM() {
				return ['strong', 0]
			},
		},
		italic: {
			toDOM() {
				return ['em', 0]
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
		colour: {
			attrs: {
				colour: {},
			},
			toDOM(mark) {
				const col = mark.attrs.colour

				return ['span', { class: 'colour ' + col }]
			},
		},
	},
})
