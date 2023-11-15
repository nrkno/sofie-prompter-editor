import { makeAutoObservable } from 'mobx'
import { RundownPlaylist, RundownPlaylistId, protectString } from '@sofie-prompter-editor/shared-model'
import { randomId } from '../lib/lib'
import { UIRundownId } from './UIRundown'
import { RundownStore } from '../stores/RundownStore'

// a lightweight domain object for tracking rundowns without their contents
export class UIRundownEntry {
	name: string = ''

	ready: boolean = false

	constructor(
		private store: RundownStore,
		public playlistId: RundownPlaylistId,
		public id = protectString<UIRundownId>(randomId())
	) {
		makeAutoObservable(this, {})

		void this.store

		// get all segments
		// this.store.connection.segment.find({
		//     query: {
		//         playlistId:
		//     }
		// })

		// register callbacks for events
		// this.store.connection.segment.on('created')
	}

	updateFromJson(json: RundownPlaylist) {
		this.name = json.label
		this.ready = true
	}

	dispose(): void {
		// unregister event handlers from services
	}
}
