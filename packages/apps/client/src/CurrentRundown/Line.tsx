import React from 'react'
import { observer } from 'mobx-react-lite'
import { UILine } from '../model/UILine'
import classes from './CurrentRundown.module.scss'

const Line = observer(({ line }: { line: UILine | undefined }): React.JSX.Element | null => {
	if (!line) return null
	return (
		<>
			<div className={classes.LineIdentifier}></div>
			<div className={classes.LineType}></div>
			<div className={classes.LineSlug}>{line.slug}</div>
			<div className={classes.LineScript}>{line.script}</div>
			<div className={classes.LineDuration}></div>
			<div className={classes.LineDuration2}></div>
		</>
	)
})
Line.displayName = 'Line'

export { Line }
