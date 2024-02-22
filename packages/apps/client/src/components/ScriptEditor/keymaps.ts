import { Command, SelectionRange, TextSelection } from 'prosemirror-state'
import { toggleMark } from 'prosemirror-commands'
import { schema } from './scriptSchema'
import { MarkType, Node } from 'prosemirror-model'

export const formatingKeymap: Record<string, Command> = {
	'Mod-b': toggleMark(schema.marks.bold),
	'Mod-i': toggleMark(schema.marks.italic),
	'Mod-u': toggleMark(schema.marks.underline),
	'Mod-r': toggleMark(schema.marks.reverse),
	'Mod-f': toggleColours(schema.marks.colour, ['red', 'yellow']),
	'Mod-F10': toggleMark(schema.marks.hidden),
}

/**
 * This toggles the colour marks between colours, taken
 * from https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.ts#L583
 */
function toggleColours(
	markType: MarkType,
	colours: string[],
	options?: {
		/**
		 * Controls whether, when part of the selected range has the mark
		 * already and part doesn't, the mark is removed (`true`, the
		 * default) or added (`false`).
		 */
		removeWhenPresent: boolean
	}
): Command {
	const removeWhenPresent = (options && options.removeWhenPresent) !== false
	return function (state, dispatch) {
		const { empty, $cursor, ranges } = state.selection as TextSelection
		if (!dispatch || (empty && !$cursor) || colours.length === 0 || !markApplies(state.doc, ranges, markType))
			return false

		if ($cursor) {
			if (markType.isInSet(state.storedMarks || $cursor.marks())) dispatch(state.tr.removeStoredMark(markType))
			else dispatch(state.tr.addStoredMark(markType.create({ colour: colours[0] })))
		} else {
			let add
			const tr = state.tr
			if (removeWhenPresent) {
				add = !ranges.some((r) => state.doc.rangeHasMark(r.$from.pos, r.$to.pos, markType))
			} else {
				add = !ranges.every((r) => {
					let missing = false
					tr.doc.nodesBetween(r.$from.pos, r.$to.pos, (node, pos, parent) => {
						if (missing) return
						missing =
							!markType.isInSet(node.marks) &&
							!!parent &&
							parent.type.allowsMarkType(markType) &&
							!(
								node.isText &&
								/^\s*$/.test(node.textBetween(Math.max(0, r.$from.pos - pos), Math.min(node.nodeSize, r.$to.pos - pos)))
							)
					})
					return !missing
				})
			}
			for (let i = 0; i < ranges.length; i++) {
				const { $from, $to } = ranges[i]

				let from = $from.pos,
					to = $to.pos
				const start = $from.nodeAfter,
					end = $to.nodeBefore
				const spaceStart = start && start.isText ? /^\s*/.exec(start.text!)![0].length : 0
				const spaceEnd = end && end.isText ? /\s*$/.exec(end.text!)![0].length : 0
				if (from + spaceStart < to) {
					from += spaceStart
					to -= spaceEnd
				}

				if (!add) {
					// this is where we may want to toggle...
					let next
					// see if the beginning has the mark
					const mark = markType.isInSet($to.marks())

					if (mark) {
						// try to find next colour
						const current = mark.attrs.colour
						const pos = colours.findIndex((c) => c === current)
						next = colours[pos + 1]
					}

					tr.removeMark($from.pos, $to.pos, markType)
					if (next) tr.addMark(from, to, markType.create({ colour: next }))
				} else {
					tr.addMark(from, to, markType.create({ colour: colours[0] }))
				}
			}
			dispatch(tr.scrollIntoView())
		}

		return true
	}
}
function markApplies(doc: Node, ranges: readonly SelectionRange[], type: MarkType) {
	for (let i = 0; i < ranges.length; i++) {
		const { $from, $to } = ranges[i]
		let can = $from.depth == 0 ? doc.inlineContent && doc.type.allowsMarkType(type) : false
		doc.nodesBetween($from.pos, $to.pos, (node: Node) => {
			if (can) return
			can = node.inlineContent && node.type.allowsMarkType(type)
		})
		if (can) return true
	}
	return false
}
