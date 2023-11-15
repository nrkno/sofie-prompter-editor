import React from 'react'
import { observer } from 'mobx-react-lite'
import { AppStore } from '../stores/AppStore'
import { Segment } from './Segment'

const CurrentRundown = observer((): React.JSX.Element => {
	const openRundown = AppStore.rundownStore.openRundown

	if (!openRundown) {
		return <p>No open rundown</p>
	}

	function onClose() {
		openRundown?.close()
	}

	return (
		<>
			<h1>{openRundown.name}</h1>
			<p>
				<button onClick={onClose}>Close</button>
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
