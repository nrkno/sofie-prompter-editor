import React from 'react'
import { action } from 'mobx'
import { observer } from 'mobx-react-lite'
import { AppStore } from '../stores/AppStore'
import { Segment } from './Segment'
import { Button } from 'react-bootstrap'

const CurrentRundown = observer((): React.JSX.Element => {
	const openRundown = AppStore.rundownStore.openRundown

	if (!openRundown) {
		return <p>No open rundown</p>
	}

	const onClose = action(() => {
		openRundown?.close()
	})

	return (
		<>
			<h1>{openRundown.name}</h1>
			<p>
				<Button variant="secondary" onClick={onClose}>
					Close
				</Button>
			</p>
			<ul>
				{openRundown.segmentsInOrder.map((segment) => (
					<li key={segment.id}>
						<Segment segment={segment} />
					</li>
				))}
			</ul>
		</>
	)
})
CurrentRundown.displayName = 'CurrentRundown'

export { CurrentRundown }
