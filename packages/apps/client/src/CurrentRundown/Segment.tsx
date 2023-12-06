import React from 'react'
import { observer } from 'mobx-react-lite'
import { UISegment } from '../model/UISegment'
import { Line } from './Line'
import classes from './CurrentRundown.module.scss'

const Segment = observer(({ segment }: { segment: UISegment }): React.JSX.Element | null => {
	if (!segment) return null

	return (
		<>
			<div className={classes.SegmentIdentifier}>{segment.name}</div>
			<ul className={classes.LineContainer}>
				{segment.linesInOrder.map((line) => (
					<li key={line.id} className={classes.Line}>
						<Line line={line} />
					</li>
				))}
			</ul>
		</>
	)
})
Segment.displayName = 'Segment'

export { Segment }
