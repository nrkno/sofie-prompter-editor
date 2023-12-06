import React from 'react'
import { APIConnection } from './api/ApiConnection.ts'
import { Rundown, RundownId, RundownPlaylist } from '@sofie-prompter-editor/shared-model'
import { TestRundown } from './TestRundown.tsx'
import { useApiConnection } from './TestUtil.tsx'

export const TestPlaylist: React.FC<{ api: APIConnection; playlist: RundownPlaylist }> = ({ api, playlist }) => {
	const [ready, setReady] = React.useState(false)
	const [rundowns, setRundowns] = React.useState<Record<RundownId, Rundown>>({})

	const updateRundowns = React.useCallback((id: RundownId, data: (prev: Rundown | undefined) => Rundown | null) => {
		setRundowns((prev) => {
			const newData = data(prev[id])
			if (newData === null) {
				const d = { ...prev }
				delete d[id]
				return d
			} else {
				return {
					...prev,
					[id]: newData,
				}
			}
		})
	}, [])

	useApiConnection(
		(connected) => {
			if (!connected) {
				// setConnected(false)
				return
			}

			// setConnected(true)

			api.rundown
				.subscribeToRundownsInPlaylist(playlist._id)
				.then(() => {
					setReady(true)
				})
				.catch(console.error)

			api.rundown.on('created', (data) => {
				updateRundowns(data._id, () => data)
			})
			api.rundown.on('updated', (data) => {
				updateRundowns(data._id, () => data)
			})
			api.rundown.on('removed', (data) => {
				updateRundowns(data._id, () => null)
			})

			// Also fetch initial list:
			api.rundown
				.find()
				.then((list) => {
					console.log('list rundowns', list)
					list.forEach((rundown) => updateRundowns(rundown._id, () => rundown))
				})
				.catch(console.error)
		},
		api,
		[playlist._id]
	)

	return (
		<div>
			<h2>Playlist {playlist.label}</h2>
			<div>Subscription status: {ready ? <span>Ready</span> : <span>Not ready</span>}</div>
			<div>
				<b>Rundowns:</b>
				<div>
					{Object.values<Rundown>(rundowns).map((rundown) => (
						<TestRundown key={rundown._id} api={api} rundown={rundown}></TestRundown>
					))}
				</div>
			</div>
		</div>
	)
}
