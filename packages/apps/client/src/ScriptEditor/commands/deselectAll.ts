import { Command, TextSelection } from 'prosemirror-state'

export const deselectAll: Command = (state, dispatch): boolean => {
	const newSelection = new TextSelection(state.selection.$to)
	const transaction = state.tr.setSelection(newSelection)
	if (dispatch) dispatch(transaction)

	return true
}
