import React from 'react'
import { observer } from 'mobx-react-lite'
import { AppStore } from '../stores/AppStore'
import { UIRundownId } from '../model/UIRundown'
import { Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

export const RundownEntry = observer(({ rundownId }: { rundownId: UIRundownId }): React.JSX.Element => {
	const rundownEntry = AppStore.rundownStore.allRundowns.get(rundownId)
	const navigate = useNavigate()

	const onOpen = () => {
		if (!rundownEntry) return
		navigate(`/rundown/${rundownEntry.playlistId}`)
	}

	return (
		<p>
			{rundownEntry?.name} <Button onClick={onOpen}>Open</Button>
		</p>
	)
})
RundownEntry.displayName = 'RundownEntry'
