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
		const lineId = e.currentTarget.dataset['lineId'] as UILineId
		RootAppStore.uiStore.setSelectedLineId(lineId)
	}

	return (
		<>
			<div className={classes.SegmentIdentifier} role="heading">
				{segment.name}
			</div>
			<ul className={classes.LineContainer}>
				{segment.linesInOrder.map((line) => (
					<li
						key={line.id}
						className={isSelected(line.id) ? classes.LineSelected : classes.Line}
						onFocus={onFocus}
						data-line-id={line.id}
						tabIndex={0}
						role="treeitem"
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
