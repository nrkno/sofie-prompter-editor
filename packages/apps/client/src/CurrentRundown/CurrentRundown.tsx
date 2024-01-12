import React from 'react'
import { action } from 'mobx'
import { observer } from 'mobx-react-lite'
import { AppStore } from '../stores/AppStore'
import { Segment } from './Segment'
import { Button } from 'react-bootstrap'
import classes from './CurrentRundown.module.scss'
import { useNavigate } from 'react-router-dom'

const CurrentRundown = observer((): React.JSX.Element => {
	const openRundown = AppStore.rundownStore.openRundown
	const navigate = useNavigate()

	if (!openRundown) {
		return <p>No open rundown</p>
	}

	const onClose = action(() => {
		openRundown?.close()
		navigate('/')
	})

	return (
		<>
			<h1>{openRundown.name}</h1>
			<p>
				<Button variant="secondary" onClick={onClose}>
					Close
				</Button>
			</p>
			<ul className={classes.SegmentLineList}>
				{openRundown.segmentsInOrder.map((segment) => (
					<li key={segment.id} className={classes.SegmentContainer}>
						<Segment segment={segment} />
					</li>
				))}
			</ul>
		</>
	)
})
CurrentRundown.displayName = 'CurrentRundown'

export { CurrentRundown }
