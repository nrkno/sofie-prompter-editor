import React, { SyntheticEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { UISegment } from 'src/model/UISegment'
import { Line } from './Line'
import classes from './CurrentRundown.module.scss'
import { RootAppStore } from 'src/stores/RootAppStore'
import { UILineId } from 'src/model/UILine'

const Segment = observer(({ segment }: { segment: UISegment }): React.JSX.Element | null => {
	if (!segment) return null

	const isRundownFilterEnabled = (RootAppStore.rundownStore.openRundown?.filter ?? null) !== null

	function isSelected(lineId: UILineId) {
		return lineId === RootAppStore.uiStore.selectedLineId
	}

	function onFocus(e: React.FocusEvent<HTMLLIElement>) {
		const lineId = e.currentTarget.dataset['objId'] as UILineId
		RootAppStore.uiStore.setSelectedLineId(lineId)
	}

	function onRecall(e: SyntheticEvent) {
		console.log('onRecall', e)

		if (!(e.currentTarget instanceof HTMLElement)) return
		const lineId = e.currentTarget.dataset['objId'] as UILineId

		RootAppStore.uiStore.emit('scrollEditorToLine', {
			lineId,
		})
	}

	const filteredLines = segment.linesInOrderFiltered

	if (filteredLines.length === 0 && isRundownFilterEnabled) return null

	return (
		<li data-segment-id={segment.id} className={classes.SegmentContainer} role="tree">
			<div className={classes.SegmentIdentifier} role="heading">
				{segment.name}
			</div>
			<ul className={classes.LineContainer}>
				{filteredLines.map((line) => (
					<Line key={line.id} line={line} selected={isSelected(line.id)} onFocus={onFocus} onRecall={onRecall} />
				))}
			</ul>
		</li>
	)
})
Segment.displayName = 'Segment'

export { Segment }
