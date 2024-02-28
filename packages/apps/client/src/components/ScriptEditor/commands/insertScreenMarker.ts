import { Command } from 'prosemirror-state'
import { schema } from '../scriptSchema'

export function insertScreenMarker(): Command {
	return function (state, dispatch) {
		const { $from } = state.selection,
			index = $from.index()
		if (!$from.parent.canReplaceWith(index, index, schema.nodes.backScreenMarker)) return false
		if (dispatch) dispatch(state.tr.replaceSelectionWith(schema.nodes.backScreenMarker.create(), false))
		return true
	}
}
