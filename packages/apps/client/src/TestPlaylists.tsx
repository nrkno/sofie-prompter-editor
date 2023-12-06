import React from 'react'
import { APIConnection } from './api/ApiConnection.ts'
import { RundownPlaylist, RundownPlaylistId } from '@sofie-prompter-editor/shared-model'
import { TestPlaylist } from './TestPlaylist.tsx'
import { useApiConnection } from './TestUtil.tsx'

export const TestPlaylists: React.FC<{ api: APIConnection }> = ({ api }) => {
	const [ready, setReady] = React.useState(false)
	const [connected, setConnected] = React.useState(false)
	const [playlists, setPlaylists] = React.useState<Record<RundownPlaylistId, RundownPlaylist>>({})

	const [selectedPlaylist, setSelectedPlaylist] = React.useState<RundownPlaylist | null>(null)

	const updatePlaylists = React.useCallback(
		(id: RundownPlaylistId, data: (prev: RundownPlaylist | undefined) => RundownPlaylist | null) => {
			setPlaylists((prev) => {
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
		},
		[]
	)

	useApiConnection(
		(connected) => {
			if (!connected) {
				setConnected(false)
				return
			}

			setConnected(true)

			api.playlist
				.subscribeToPlaylists()
				.then(() => {
					setReady(true)
				})
				.catch(console.error)

			api.playlist.on('created', (data) => {
				updatePlaylists(data._id, () => data)
			})
			api.playlist.on('updated', (data) => {
				updatePlaylists(data._id, () => data)
			})
			// api.playlist.on('patched', (data) => {
			// 	updatePlaylists(data._id, (prev) => {
			// 		if (!prev) {
			// 			// We need to do a resync:
			// 			api.playlist
			// 				.get(data._id)
			// 				.then((playlist) => {
			// 					updatePlaylists(playlist._id, () => playlist)
			// 				})
			// 				.catch(console.error)

			// 			return patch({} as any, data)
			// 		} else {
			// 			return patch(prev, data)
			// 		}
			// 	})
			// })
			api.playlist.on('removed', (id) => {
				updatePlaylists(id, () => null)
			})

			// Also fetch initial list:
			api.playlist
				.find()
				.then((list) => {
					console.log('list playlists', list)
					list.forEach((playlist) => updatePlaylists(playlist._id, () => playlist))
				})
				.catch(console.error)
		},
		api,
		[]
	)

	return (
		<div>
			<h1>Playlists</h1>
			<div>Connection status: {connected ? <span>Connected</span> : <span>Not connected</span>}</div>
			<div>Subscription status: {ready ? <span>Ready</span> : <span>Not ready</span>}</div>
			<h2>Rundown playlists</h2>
			<div>
				<table>
					<thead>
						<tr>
							<th>label</th>
							<th>modified</th>
							<th>isActive</th>
							<th>rehearsal</th>
						</tr>
					</thead>
					<tbody>
						{Object.values<RundownPlaylist>(playlists).map((playlist) => (
							<tr key={playlist._id}>
								<td>{playlist.label}</td>
								<td>{playlist.modified}</td>
								<td>{playlist.isActive ? 'yes' : 'no'}</td>
								<td>{playlist.rehearsal ? 'yes' : 'no'}</td>
								<td>
									<button onClick={() => setSelectedPlaylist(playlist)}>Select</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div>{selectedPlaylist && <TestPlaylist api={api} playlist={selectedPlaylist} />}</div>
		</div>
	)
}
