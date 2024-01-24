import React from 'react'
import { observer } from 'mobx-react-lite'
import { UIRundown } from 'src/model/UIRundown'
import classes from './RundownOutput.module.scss'
import { Segment } from './Segment'

export const RundownOutput = observer(function RundownOutput({ rundown }: { rundown: UIRundown }): React.ReactNode {
	return (
		<div className={classes.RundownOutput}>
			<h1>{rundown.name}</h1>
			{rundown.segmentsInOrder.map((segment) => (
				<Segment key={segment.id} segment={segment} />
			))}
			<div className="spacer" />
		</div>
	)
})
RundownOutput.displayName = 'RundownOutput'
