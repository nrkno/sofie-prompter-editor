import React from 'react'
import { keys } from 'mobx'
import { observer } from 'mobx-react-lite'
import { RootAppStore } from 'src/stores/RootAppStore'
import { UIRundownId } from 'src/model/UIRundown'
import { RundownEntry } from './RundownEntry'
import { SystemStatusAlertBars } from 'src/components/SystemStatusAlertBars/SystemStatusAlertBars'

export const RundownList = observer((): React.JSX.Element => {
	const allRundownIds = keys<UIRundownId>(RootAppStore.rundownStore.allRundowns)

	return (
		<>
			<SystemStatusAlertBars />
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
