import React from 'react'
import { observer } from 'mobx-react-lite'
import { AppStore } from '../stores/AppStore'
import { UIRundownId } from '../model/UIRundown'
import { action } from 'mobx'
import { Button } from 'react-bootstrap'

const RundownEntry = observer(({ rundownId }: { rundownId: UIRundownId }): React.JSX.Element => {
	const rundownEntry = AppStore.rundownStore.allRundowns.get(rundownId)

	const onOpen = action(() => {
		if (!rundownEntry) return
		AppStore.rundownStore.loadRundown(rundownEntry.playlistId)
	})

	return (
		<p>
			{rundownEntry?.name} <Button onClick={onOpen}>Open</Button>
		</p>
	)
})
RundownEntry.displayName = 'RundownEntry'

export { RundownEntry }
