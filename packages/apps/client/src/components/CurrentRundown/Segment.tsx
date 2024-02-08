import React from 'react'
import { observer } from 'mobx-react-lite'
import { UISegment } from 'src/model/UISegment'
import { Line } from './Line'
import classes from './CurrentRundown.module.scss'
import { RootAppStore } from 'src/stores/RootAppStore'
import { UILineId } from 'src/model/UILine'

const Segment = observer(({ segment }: { segment: UISegment }): React.JSX.Element | null => {
	if (!segment) return null

	function isSelected(lineId: UILineId) {
		return lineId === RootAppStore.uiStore.selectedLineId
	}

	function onFocus(e: React.FocusEvent<HTMLLIElement>) {
		const lineId = e.currentTarget.dataset['objId'] as UILineId
		RootAppStore.uiStore.setSelectedLineId(lineId)
	}

	return (
		<li data-segment-id={segment.id} className={classes.SegmentContainer} role="tree">
			<div className={classes.SegmentIdentifier} role="heading">
				{segment.name}
			</div>
			<ul className={classes.LineContainer}>
				{segment.linesInOrder.map((line) => (
					<Line key={line.id} line={line} selected={isSelected(line.id)} onFocus={onFocus} />
				))}
			</ul>
		</li>
	)
})
Segment.displayName = 'Segment'

export { Segment }
