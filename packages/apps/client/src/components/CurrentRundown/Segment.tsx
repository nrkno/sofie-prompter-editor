import React, { SyntheticEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { UISegment } from 'src/model/UISegment'
import { Line } from './Line'
import { RootAppStore } from 'src/stores/RootAppStore'
import { UILineId } from 'src/model/UILine'

const Segment = observer(({ segment }: { segment: UISegment }): React.JSX.Element | null => {
	if (!segment) return null

	const isRundownFilterEnabled = (RootAppStore.rundownStore.openRundown?.filter ?? null) !== null

	function isSelected(lineId: UILineId) {
		return lineId === RootAppStore.uiStore.selectedLineId
	}

	function isEdited(lineId: UILineId) {
		return lineId === RootAppStore.rundownStore.openRundown?.editorCaretPositionLineId
	}

	function onFocus(e: React.FocusEvent<HTMLLIElement>) {
		const lineId = e.currentTarget.dataset['objId'] as UILineId
		RootAppStore.uiStore.setSelectedLineId(lineId)
	}

	function onRecall(e: SyntheticEvent) {
		if (!(e.currentTarget instanceof HTMLElement)) return
		const lineId = e.currentTarget.dataset['objId'] as UILineId

		// TODO: Emitting this event should be moved so that it's part of the business logic
		RootAppStore.control.jumpToObject(lineId)
		RootAppStore.uiStore.emit('scrollEditorToLine', {
			lineId,
		})

		// An enter key at the wrong time can cause the contents of the script to be cleared in an unexpected way
		// so we need to prevent it
		if (e.type === 'keydown') e.preventDefault()
	}

	const filteredLines = segment.linesInOrderFiltered

	if (filteredLines.length === 0 && isRundownFilterEnabled) return null

	return (
		<>
			{filteredLines.map((line, index) => (
				<Line
					segmentName={index === 0 ? segment.name : undefined}
					key={line.id}
					line={line}
					selected={isSelected(line.id)}
					edited={isEdited(line.id)}
					onFocus={onFocus}
					onRecall={onRecall}
				/>
			))}
		</>
	)
})
Segment.displayName = 'Segment'

export { Segment }
