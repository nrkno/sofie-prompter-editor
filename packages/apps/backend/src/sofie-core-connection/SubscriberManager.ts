import { action, makeAutoObservable, observable } from 'mobx'
import { RundownId, RundownPlaylistId } from 'packages/shared/model/dist'
import { RealTimeConnection } from '@feathersjs/feathers'

export class SubscriberManager {
	public readonly playlists = observable.map<
		RundownPlaylistId,
		{
			connections: RealTimeConnection[]
		}
	>()
	public readonly rundowns = observable.set<RundownId>()

	constructor() {
		makeAutoObservable(this, {
			subscribeToPlaylist: action,
			unsubscribeFromPlaylists: action,
			subscribeToRundown: action,
			unsubscribeFromRundown: action,
		})
	}

	public subscribeToPlaylist(connection: RealTimeConnection, playlistId: RundownPlaylistId) {
		// Add connection to a subscription
		let sub = this.playlists.get(playlistId) || { connections: [] }
		sub.connections.push(connection)
		this.playlists.set(playlistId, sub)
	}
	public unsubscribeFromPlaylists(connection: RealTimeConnection) {
		// Remove connection from all subscriptions

		for (const [playlistId, sub] of this.playlists.entries()) {
			let changed = false
			const i = sub.connections.indexOf(connection)
			if (i !== -1) {
				sub.connections.splice(i, 1)
				changed = true
			}

			if (changed) {
				if (sub.connections.length === 0) {
					this.playlists.delete(playlistId)
				} else {
					this.playlists.set(playlistId, sub)
				}
			}
		}
	}
	public subscribeToRundown(rundownId: RundownId) {
		this.rundowns.add(rundownId)
	}
	public unsubscribeFromRundown(rundownId: RundownId) {
		this.rundowns.delete(rundownId)
	}
}
