import { action, makeAutoObservable, observable } from 'mobx'
import { RundownPlaylistId } from '@sofie-prompter-editor/shared-model'
import { RealTimeConnection } from '@feathersjs/feathers'
import * as Core from './CoreDataTypes/index.js'

export class SubscriberManager {
	public readonly playlists = observable.map<
		RundownPlaylistId,
		{
			connections: RealTimeConnection[]
		}
	>()
	public readonly rundowns = observable.set<Core.RundownId>()
	public readonly showStyleBases = observable.set<Core.ShowStyleBaseId>()
	public readonly showStyleVariants = observable.set<Core.ShowStyleVariantId>()

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
	public subscribeToRundown(rundownId: Core.RundownId) {
		if (!this.rundowns.has(rundownId)) {
			this.rundowns.add(rundownId)
		}
	}
	public unsubscribeFromRundown(rundownId: Core.RundownId) {
		if (this.rundowns.has(rundownId)) {
			this.rundowns.delete(rundownId)
		}
	}

	public setShowStyleBaseSubscriptions(showStyleBaseIds: Core.ShowStyleBaseId[]) {
		updateSet(this.showStyleBases, showStyleBaseIds)
	}
	public setShowStyleVariantSubscriptions(showStyleVariantIds: Core.ShowStyleVariantId[]) {
		updateSet(this.showStyleVariants, showStyleVariantIds)
	}
}

function updateSet<T>(set: Set<T>, newValues: T[]) {
	const newSet = new Set<T>(newValues)

	// Remove values that doesn't exist in list:
	for (const oldValue of set.keys()) {
		if (!newSet.has(oldValue)) {
			set.delete(oldValue)
		}
	}
	// Add new values from list:
	for (const newValue of newValues) {
		if (!set.has(newValue)) {
			set.add(newValue)
		}
	}
}
