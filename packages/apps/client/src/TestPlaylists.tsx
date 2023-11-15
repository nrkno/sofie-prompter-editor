import React, { useEffect } from 'react'
import { APIConnection } from './api/ApiConnection.ts'
import { RundownPlaylist, RundownPlaylistId } from '@sofie-prompter-editor/shared-model'

export const TestPlaylists: React.FC<{ api: APIConnection }> = ({ api }) => {
	const [ready, setReady] = React.useState(false)
	const [connected, setConnected] = React.useState(false)
	const [playlists, setPlaylists] = React.useState<Record<RundownPlaylistId, RundownPlaylist>>({})

	const updatePlaylists = React.useCallback((id: RundownPlaylistId, data: RundownPlaylist | null) => {
		if (data === null) {
			setPlaylists((prev) => {
				const d = { ...prev }
				delete d[id]
				return d
			})
		} else {
			setPlaylists((prev) => {
				return {
					...prev,
					[id]: data,
				}
			})
		}
	}, [])

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
				updatePlaylists(data._id, data)
			})
			api.playlist.on('updated', (data) => {
				updatePlaylists(data._id, data)
			})
			api.playlist.on('removed', (id) => {
				updatePlaylists(id, null)
			})
			// Also fetch initial list:
			api.playlist
				.find()
				.then((list) => {
					console.log('list', list)
					list.forEach((playlist) => updatePlaylists(playlist._id, playlist))
				})
				.catch(console.error)
		},
		api,
		[]
	)

	return (
		<div>
			<h2>Rundown playlists</h2>
			<div>Connection status: {connected ? <div>Connected</div> : <div>Not connected</div>}</div>
			<div>Subscription status: {ready ? <div>Ready</div> : <div>Not ready</div>}</div>
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
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

function useApiConnection(
	effect: (connected: boolean) => void,
	api: APIConnection,
	deps?: React.DependencyList | undefined
): void {
	const [connected, setConnected] = React.useState(api.connected)

	useEffect(() => {
		const onConnected = () => {
			setConnected(true)
		}
		const onDisconnected = () => {
			setConnected(false)
		}
		api.on('connected', onConnected)
		api.on('disconnected', onDisconnected)
		return () => {
			api.off('connected', onConnected)
			api.off('disconnected', onDisconnected)
		}
	}, [])

	useEffect(() => {
		effect(connected)
	}, [connected, ...(deps || [])])
}
