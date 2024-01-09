import React from 'react'
import { observer } from 'mobx-react-lite'
import { UISegment } from '../model/UISegment'
import { Line } from './Line'
import classes from './CurrentRundown.module.scss'
import { AppStore } from '../stores/AppStore'
import { UILineId } from '../model/UILine'

const Segment = observer(({ segment }: { segment: UISegment }): React.JSX.Element | null => {
	if (!segment) return null

	function isSelected(lineId: UILineId) {
		return lineId === AppStore.uiStore.selectedLineId
	}

	function onClick(e: React.MouseEvent<HTMLLIElement>) {
		const lineId = e.currentTarget.dataset['lineId'] as UILineId
		AppStore.uiStore.setSelectedLineId(lineId)
	}

	return (
		<>
			<div className={classes.SegmentIdentifier}>{segment.name}</div>
			<ul className={classes.LineContainer}>
				{segment.linesInOrder.map((line) => (
					<li
						key={line.id}
						className={isSelected(line.id) ? classes.LineSelected : classes.Line}
						onClickCapture={onClick}
						data-line-id={line.id}
					>
						<Line line={line} />
					</li>
				))}
			</ul>
		</>
	)
})
Segment.displayName = 'Segment'

export { Segment }
