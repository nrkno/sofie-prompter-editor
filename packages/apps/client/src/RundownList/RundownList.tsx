import React from 'react'
import { keys } from 'mobx'
import { observer } from 'mobx-react-lite'
import { RootAppStore } from '../stores/RootAppStore'
import { UIRundownId } from '../model/UIRundown'
import { RundownEntry } from './RundownEntry'

export const RundownList = observer((): React.JSX.Element => {
	const allRundownIds = keys<UIRundownId>(RootAppStore.rundownStore.allRundowns)

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
