import { observable, action, flow, makeObservable, IReactionDisposer, reaction } from 'mobx'
import { RundownPlaylist, RundownPlaylistId } from '@sofie-prompter-editor/shared-model'
import { APIConnection, RootAppStore } from './RootAppStore'
import { UIRundown } from '../model/UIRundown'
import { UIRundownEntry } from '../model/UIRundownEntry'

export class RundownStore {
	showingOnlyScripts = false

	allRundowns = observable.map<RundownPlaylistId, UIRundownEntry>()
	openRundown: UIRundown | null = null

	reactions: IReactionDisposer[] = []

	constructor(public appStore: typeof RootAppStore, public connection: APIConnection) {
		makeObservable(this, {
			openRundown: observable,
			showingOnlyScripts: observable,
		})

		// get all rundowns
		this.setupUIRundownDataSubscriptions()
		this.loadAllUIRundownData()
	}

	setupUIRundownDataSubscriptions = action(() => {
		this.reactions.push(
			reaction(
				() => this.appStore.connected,
				async (connected) => {
					if (!connected) return

					await this.connection.playlist.subscribeToPlaylists()
				},
				{
					fireImmediately: true,
				}
			)
		)

		this.connection.playlist.on('created', this.onPlaylistCreated)
		// Note: updated and removed events are handled by the UIRundownEntry's themselves
	})

	private onPlaylistCreated = action('onPlaylistCreated', (json: RundownPlaylist) => {
		const existing = this.allRundowns.get(json._id)

		if (!existing) {
			const newRundownEntry = new UIRundownEntry(this, json._id)
			this.allRundowns.set(newRundownEntry.id, newRundownEntry)
			newRundownEntry.updateFromJson(json)
			return
		}

		existing.updateFromJson(json)
	})

	loadAllUIRundownData = flow(function* (this: RundownStore) {
		const playlists = yield this.connection.playlist.find()
		// add UIRundownEntries to allRundowns

		this.clearAllRundowns()

		for (const playlist of playlists) {
			this.onPlaylistCreated(playlist)
		}
	})

	clearAllRundowns = action('clearAllRundowns', () => {
		for (const rundown of this.allRundowns.values()) {
			rundown.remove()
		}
	})

	loadRundown = flow(function* (this: RundownStore, id: RundownPlaylistId) {
		this.openRundown?.close()
		// get a full rundown from backend and create a UIRundown object
		// assign to openRundown
		const playlist = yield this.connection.playlist.get(id)
		if (!playlist) {
			throw new Error('Playlist not found')
		}

		const newRundown = new UIRundown(this, playlist._id)
		newRundown.updateFromJson(playlist)
		this.openRundown = newRundown
	})

	destroy = () => {
		this.reactions.forEach((dispose) => dispose())
	}
}
