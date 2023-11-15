import React from 'react'
import { observer } from 'mobx-react-lite'
import { AppStore } from '../stores/AppStore'
import { UIRundownId } from '../model/UIRundown'

const RundownEntry = observer(({ rundownId }: { rundownId: UIRundownId }): React.JSX.Element => {
	const rundownEntry = AppStore.rundownStore.allRundowns.get(rundownId)

	function onOpen() {
		if (!rundownEntry) return
		AppStore.rundownStore.loadRundown(rundownEntry.playlistId)
	}

	return (
		<p>
			{rundownEntry?.name} <button onClick={onOpen}>Open</button>
		</p>
	)
})
RundownEntry.displayName = 'RundownEntry'

export { RundownEntry }
