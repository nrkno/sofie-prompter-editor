import { makeAutoObservable, observable, action, flow } from 'mobx'
import { RundownPlaylistId } from '@sofie-prompter-editor/shared-model'
import { APIConnection, AppStore } from './AppStore'
import { UIRundown } from '../model/UIRundown'
import { UIRundownEntry } from '../model/UIRundownEntry'

export class RundownStore {
	showingOnlyScripts = false

	allRundowns = observable.map<RundownPlaylistId, UIRundownEntry>()
	openRundown: UIRundown | null = null

	constructor(public appStore: typeof AppStore, public connection: APIConnection) {
		makeAutoObservable(this, {
			loadAllUIRundownData: action,
			clearAllRundowns: action,
			loadRundown: action,
		})

		// get all rundowns
		this.setupUIRundownDataSubscriptions()
		this.loadAllUIRundownData()
	}

	setupUIRundownDataSubscriptions = flow(function* (this: RundownStore) {
		yield this.connection.playlist.subscribeToPlaylists()

		this.connection.playlist.on(
			'created',
			action((playlist) => {
				const newRundownEntry = new UIRundownEntry(this, playlist._id)
				this.allRundowns.set(newRundownEntry.id, newRundownEntry)
				newRundownEntry.updateFromJson(playlist)
			})
		)
		// Note: updated and removed events are handled by the UIRundownEntry's themselves
	})
	loadAllUIRundownData = flow(function* (this: RundownStore) {
		const playlists = yield this.connection.playlist.find()
		// add UIRundownEntries to allRundowns

		this.clearAllRundowns()

		for (const playlist of playlists) {
			const newRundownEntry = new UIRundownEntry(this, playlist._id)
			this.allRundowns.set(newRundownEntry.id, newRundownEntry)
			newRundownEntry.updateFromJson(playlist)
		}
	})

	clearAllRundowns() {
		for (const rundown of this.allRundowns.values()) {
			rundown.remove()
		}
	}

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
}
