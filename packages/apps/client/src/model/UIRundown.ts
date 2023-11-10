import { computed, makeAutoObservable, observable } from 'mobx'
import { ProtectedString, RundownPlaylist, RundownPlaylistId, protectString } from 'packages/shared/model/dist'
import { UISegment, UISegmentId } from './UISegment'
import { RundownStore } from '../stores/RundownStore'
import { randomId } from '../lib/lib'

export class UIRundown {
	name: string = ''

	ready: boolean = false

	segments = observable.map<UISegmentId, UISegment>()

	constructor(
		private store: RundownStore,
		public playlistId: RundownPlaylistId,
		public id = protectString<UIRundownId>(randomId())
	) {
		makeAutoObservable(this, {
			segmentIdsInOrder: computed,
		})

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

	get segmentIdsInOrder(): UISegmentId[] {
		return []
	}

	dispose(): void {
		// unregister event handlers from services
	}
}

export type UIRundownId = ProtectedString<'UIRundownId', string>
