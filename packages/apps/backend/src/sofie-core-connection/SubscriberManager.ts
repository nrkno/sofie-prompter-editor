import { action, autorun, makeObservable, observable } from 'mobx'
import { RundownPlaylistId } from '@sofie-prompter-editor/shared-model'
import * as Core from './CoreDataTypes/index.js'

export class SubscriberManager {
	public readonly playlists = observable.map<RundownPlaylistId, true>()
	public readonly rundowns = observable.set<Core.RundownId>()
	public readonly showStyleBases = observable.set<Core.ShowStyleBaseId>()
	public readonly showStyleVariants = observable.set<Core.ShowStyleVariantId>()

	constructor() {
		makeObservable(this, {
			subscribeToPlaylist: action,
			unsubscribeFromPlaylist: action,

			subscribeToRundowns: action,
			setShowStyleBaseSubscriptions: action,
			setShowStyleVariantSubscriptions: action,
		})
		autorun(() => {
			console.log('playlists', Array.from(this.playlists.keys()))
		})
	}

	public subscribeToPlaylist(playlistId: RundownPlaylistId) {
		console.log('subscribeToPlaylist')
		if (!this.playlists.has(playlistId)) {
			this.playlists.set(playlistId, true)
		}
	}
	public getSubscribedPlaylists(): RundownPlaylistId[] {
		return Array.from(this.playlists.keys())
	}

	public unsubscribeFromPlaylist(playlistId: RundownPlaylistId) {
		console.log('unsubscribeFromPlaylists')
		if (this.playlists.has(playlistId)) {
			this.playlists.delete(playlistId)
		}
	}
	// public unsubscribeFromPlaylists(connection: RealTimeConnection) {
	// 	console.log('unsubscribeFromPlaylists', connection)
	// 	// Remove connection from all subscriptions

	// 	for (const [playlistId, sub] of this.playlists.entries()) {
	// 		let changed = false
	// 		const i = sub.connections.findIndex((c) => isEqual(c, connection))
	// 		console.log('p length', sub.connections.length)
	// 		console.log('p', playlistId, i)
	// 		if (i !== -1) {
	// 			sub.connections.splice(i, 1)
	// 			changed = true
	// 		}
	// 		console.log('p length', sub.connections.length)

	// 		if (changed) {
	// 			if (sub.connections.length === 0) {
	// 				this.playlists.delete(playlistId)
	// 			} else {
	// 				this.playlists.set(playlistId, sub)
	// 			}
	// 		}
	// 	}
	// }
	public subscribeToRundowns(rundownIds: Core.RundownId[]) {
		updateSet(this.rundowns, rundownIds)
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
