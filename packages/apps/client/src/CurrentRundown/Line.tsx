import React from 'react'
import { observer } from 'mobx-react-lite'
import { UILine } from '../model/UILine'
import classes from './CurrentRundown.module.scss'
import { LineTypeIcon } from './LineTypeIcon'
import { TimeSpan } from '../components/TimeSpan/TimeSpan'

const Line = observer(({ line }: { line: UILine | undefined }): React.JSX.Element | null => {
	if (!line) return null
	return (
		<>
			<div className={classes.LineIdentifier}>{line.identifier}</div>
			<div className={classes.LineType}>
				<LineTypeIcon type={line.lineType?.style}>{line.lineType?.label}</LineTypeIcon>
			</div>
			<div className={classes.LineSlug}>{line.slug}</div>
			<div className={classes.LineScript}>{line.script}</div>
			<div className={classes.LineDuration}>
				<TimeSpan>{line.expectedDuration}</TimeSpan>
			</div>
			<div className={classes.LineDuration2}></div>
		</>
	)
})
Line.displayName = 'Line'

export { Line }
