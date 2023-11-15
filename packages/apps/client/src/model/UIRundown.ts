import { action, computed, makeAutoObservable, observable, values, get } from 'mobx'
import {
	ProtectedString,
	Rundown,
	RundownId,
	RundownPlaylist,
	RundownPlaylistId,
	protectString,
} from '@sofie-prompter-editor/shared-model'
import { UISegment, UISegmentId } from './UISegment'
import { RundownStore } from '../stores/RundownStore'
import { randomId } from '../lib/lib'

export class UIRundown {
	name: string = ''

	ready: boolean = false

	segments = observable.map<UISegmentId, UISegment>()

	_rundowns = observable.map<RundownId, Rundown>()

	constructor(
		private store: RundownStore,
		public playlistId: RundownPlaylistId,
		public id = protectString<UIRundownId>(randomId())
	) {
		makeAutoObservable(this, {
			segmentsInOrder: computed,
		})

		this.store.connection.rundown
			.find({
				query: {
					playlistId: this.playlistId,
				},
			})
			.then(
				action('loadRundowns', (rundowns) => {
					return Promise.all(
						rundowns.map((rundown) => {
							this._rundowns.set(rundown._id, rundown)
							return this.store.connection.segment.find({
								query: {
									rundownId: rundown._id,
								},
							})
						})
					)
				})
			)
			.then((segmentArrays) => segmentArrays.flat())
			.then(
				action('loadSegments', (segments) => {
					for (const segment of segments) {
						const newSegment = new UISegment(this.store, segment._id)
						this.segments.set(newSegment.id, newSegment)
						newSegment.updateFromJson(segment)
					}
				})
			)

		// get all segments

		// register callbacks for events
		// this.store.connection.segment.on('created')
	}

	updateFromJson(json: RundownPlaylist) {
		this.name = json.label
		this.ready = true
	}

	get segmentsInOrder(): UISegment[] {
		return values(this.segments)
			.slice()
			.sort((a, b) => {
				if (a.rundownId === b.rundownId) return a.rank - b.rank
				const rundownRankA = get(this._rundowns, a.rundownId)?.rank ?? 0
				const rundownRankB = get(this._rundowns, b.rundownId)?.rank ?? 0
				return rundownRankA - rundownRankB
			})
	}

	close(): void {
		this.store.openRundown = null
		this.dispose()
	}

	dispose(): void {
		// unregister event handlers from services
	}
}

export type UIRundownId = ProtectedString<'UIRundownId', string>
