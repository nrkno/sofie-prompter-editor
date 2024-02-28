import { observable, action, flow, makeObservable, IReactionDisposer, reaction } from 'mobx'
import { OutputSettings, RundownPlaylist, RundownPlaylistId } from '@sofie-prompter-editor/shared-model'
import { APIConnection, RootAppStore } from './RootAppStore'
import { UIRundown } from '../model/UIRundown'
import { UIRundownEntry } from '../model/UIRundownEntry'
import { getCurrentTime } from 'src/lib/getCurrentTime'

export class RundownStore {
	showingOnlyScripts = false

	allRundowns = observable.map<RundownPlaylistId, UIRundownEntry>()
	openRundown: UIRundown | null = null

	outputSettings: OutputSettings | null = null

	reactions: IReactionDisposer[] = []

	constructor(public appStore: typeof RootAppStore, public connection: APIConnection) {
		makeObservable(this, {
			openRundown: observable,
			showingOnlyScripts: observable,
			outputSettings: observable,
		})

		this.setupUIRundownDataSubscriptions()
		this.setupOutputSettingsSubscription()
	}

	private onOutputSettingsUpdated = action('onOutputSettingsUpdated', (outputSettings: OutputSettings) => {
		this.outputSettings = outputSettings
	})

	setupOutputSettingsSubscription = action(() => {
		this.reactions.push(
			this.appStore.whenConnected(async () => {
				// On connected / reconnected

				// Setup subscription and load initial data:
				const initialData = await this.connection.outputSettings.subscribe()
				this.onOutputSettingsUpdated(initialData)
			})
		)

		this.connection.outputSettings.on('updated', this.onOutputSettingsUpdated)
	})

	setupUIRundownDataSubscriptions = action(() => {
		this.reactions.push(
			this.appStore.whenConnected(async () => {
				// On connected / reconnected

				// Setup subscription and load initial data:

				const playlists = await this.connection.playlist.subscribeToPlaylists()

				// Remove non-existent rundowns:
				for (const rundown of this.allRundowns.values()) {
					if (!playlists.find((p) => p._id === rundown.id)) rundown.remove()
				}
				// Add new rundowns:
				for (const playlist of playlists) {
					this.onPlaylistCreated(playlist)
				}
			})
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

	loadRundown = flow(function* (this: RundownStore, id: RundownPlaylistId) {
		// get a full rundown from backend and create a UIRundown object
		// assign to openRundown
		const playlist = yield this.connection.playlist.get(id)
		if (!playlist) {
			throw new Error('Playlist not found')
		}

		if (this.openRundown?.id === id) return // Rundown already loaded

		// Close and load a new Rundown:
		this.closeRundown()
		const newRundown = new UIRundown(this, playlist._id)
		newRundown.updateFromJson(playlist)
		this.openRundown = newRundown
	})

	closeRundown = action(() => {
		if (this.openRundown === null) return

		this.openRundown.dispose()
		this.openRundown = null
	})

	sendRundownToOutput = (id: RundownPlaylistId) => {
		if (!this.outputSettings) return
		this.connection.viewPort.patch(null, {
			lastKnownState: {
				state: {
					offset: {
						target: null,
						offset: 0,
					},
					speed: 0,
					animatedOffset: 0,
				},
				timestamp: getCurrentTime(),
			},
		})
		this.connection.outputSettings.patch(null, {
			activeRundownPlaylistId: id,
		})
	}

	destroy = () => {
		this.reactions.forEach((dispose) => dispose())
	}
}
