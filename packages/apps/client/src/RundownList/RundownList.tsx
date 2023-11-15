import React from 'react'
import { keys } from 'mobx'
import { observer } from 'mobx-react-lite'
import { AppStore } from '../stores/AppStore'
import { UIRundownId } from '../model/UIRundown'
import { RundownEntry } from './RundownEntry'

const RundownList = observer((): React.JSX.Element => {
	const allRundownIds = keys<UIRundownId>(AppStore.rundownStore.allRundowns)

	return (
		<>
			<ul>
				{allRundownIds.map((rundownId) => (
					<li key={rundownId}>
						<RundownEntry rundownId={rundownId} />
					</li>
				))}
			</ul>
		</>
	)
})
RundownList.displayName = 'RundownList'

export { RundownList }
