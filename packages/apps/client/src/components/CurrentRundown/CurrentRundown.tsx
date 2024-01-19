import React from 'react'
import { action } from 'mobx'
import { observer } from 'mobx-react-lite'
import { RootAppStore } from 'src/stores/RootAppStore'
import { Segment } from './Segment'
import { Button } from 'react-bootstrap'
import classes from './CurrentRundown.module.scss'
import { useNavigate } from 'react-router-dom'
import { SystemStatusAlertBars } from 'src/components/SystemStatusAlertBars/SystemStatusAlertBars'

const CurrentRundown = observer((): React.JSX.Element => {
	const openRundown = RootAppStore.rundownStore.openRundown
	const navigate = useNavigate()

	if (!openRundown) {
		return <p>No open rundown</p>
	}

	const onClose = action(() => {
		openRundown?.close()
		navigate('/')
	})

	const onSendToOutput = action(() => {
		RootAppStore.rundownStore.sendRundownToOutput(openRundown.id)
	})

	return (
		<>
			<h1>{openRundown.name}</h1>
			<p>
				<Button variant="secondary" onClick={onClose}>
					Close
				</Button>
				<Button variant="primary" onClick={onSendToOutput}>
					Send to Output
				</Button>
			</p>
			<SystemStatusAlertBars />
			<ul className={classes.SegmentLineList}>
				{openRundown.segmentsInOrder.map((segment) => (
					<li key={segment.id} data-segment-id={segment.id} className={classes.SegmentContainer}>
						<Segment segment={segment} />
					</li>
				))}
			</ul>
		</>
	)
})
CurrentRundown.displayName = 'CurrentRundown'

export { CurrentRundown }
