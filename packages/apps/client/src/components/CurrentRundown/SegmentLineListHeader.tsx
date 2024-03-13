import React from 'react'
import classes from './SegmentLineListHeader.module.scss'

export function SegmentLineListHeader(): React.ReactNode {
	return (
		<li className={classes.SegmentLineListHeader}>
			<div className={classes.HeaderScripts}>Scripts</div>
			<div className={classes.HeaderReadTime}>Read Time</div>
			<div className={classes.HeaderExpectedDuration}>Dur.</div>
		</li>
	)
}
