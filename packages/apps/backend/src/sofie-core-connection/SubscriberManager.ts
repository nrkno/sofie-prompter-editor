import { action, makeObservable, observable } from 'mobx'
import { RundownPlaylistId } from '@sofie-prompter-editor/shared-model'
import * as Core from './CoreDataTypes/index.js'
import { LoggerInstance } from '../lib/logger.js'

export class SubscriberManager {
	public readonly playlists = observable.map<RundownPlaylistId, true>()
	public readonly rundowns = observable.set<Core.RundownId>()
	public readonly showStyleBases = observable.set<Core.ShowStyleBaseId>()
	public readonly showStyleVariants = observable.set<Core.ShowStyleVariantId>()

	private log: LoggerInstance

	constructor(log: LoggerInstance) {
		makeObservable(this, {
			subscribeToPlaylist: action,
			unsubscribeFromPlaylist: action,

			subscribeToRundowns: action,
			setShowStyleBaseSubscriptions: action,
			setShowStyleVariantSubscriptions: action,
		})
		this.log = log.category('SofieCoreConnection')
	}

	public subscribeToPlaylist(playlistId: RundownPlaylistId) {
		if (!this.playlists.has(playlistId)) {
			this.log.debug(`Add subscribtion to playlist ${playlistId}`)
			this.playlists.set(playlistId, true)
		}
	}
	public getSubscribedPlaylists(): RundownPlaylistId[] {
		return Array.from(this.playlists.keys())
	}

	public unsubscribeFromPlaylist(playlistId: RundownPlaylistId) {
		if (this.playlists.has(playlistId)) {
			this.log.debug(`Remove subscribtion from playlist ${playlistId}`)
			this.playlists.delete(playlistId)
		}
	}
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
