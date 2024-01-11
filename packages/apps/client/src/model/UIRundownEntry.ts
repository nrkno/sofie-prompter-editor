import { action, makeAutoObservable } from 'mobx'
import { RundownId, RundownPlaylist, RundownPlaylistId, protectString } from '@sofie-prompter-editor/shared-model'
import { RundownStore } from '../stores/RundownStore'

// a lightweight domain object for tracking rundowns without their contents
export class UIRundownEntry {
	name: string = ''

	ready: boolean = false

	constructor(private store: RundownStore, public id: RundownPlaylistId) {
		makeAutoObservable(this, {
			updateFromJson: action,
		})

		void this.store

		this.store.connection.playlist.on('updated', (json: RundownPlaylist) => {
			if (this.id !== json._id) return

			this.updateFromJson(json)
		})

		this.store.connection.playlist.on('removed', (id: RundownPlaylistId) => {
			if (this.id !== id) return

			this.remove()
		})
	}

	updateFromJson(json: RundownPlaylist) {
		this.name = json.label
		this.ready = true
	}

	remove(): void {
		this.store.allRundowns.delete(this.id)
		this.dispose()
	}

	dispose(): void {
		// unregister event handlers from services
	}
}
