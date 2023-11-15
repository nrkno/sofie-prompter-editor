import { action, computed, makeAutoObservable, observable } from 'mobx'
import {
	ProtectedString,
	Rundown,
	RundownId,
	RundownPlaylist,
	RundownPlaylistId,
	Segment,
	protectString,
} from '@sofie-prompter-editor/shared-model'
import { UISegment, UISegmentId } from './UISegment'
import { RundownStore } from '../stores/RundownStore'
import { randomId } from '../lib/lib'

export class UIRundown {
	name: string = ''

	ready: boolean = false

	segments = observable.map<UISegmentId, UISegment>()

	private rundowns = observable.map<RundownId, Rundown>()

	constructor(
		private store: RundownStore,
		public playlistId: RundownPlaylistId,
		public id = protectString<UIRundownId>(randomId())
	) {
		makeAutoObservable(this, {
			updateFromJson: action,
			segmentsInOrder: computed,
			close: action,
		})

		this.store.connection.rundown
			.find({
				query: {
					playlistId: this.playlistId,
				},
			})
			.then(
				action('receiveRundowns', (rundowns) => {
					return Promise.all(
						rundowns.map((rundown) => {
							this.rundowns.set(rundown._id, rundown)
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
				action('receiveSegments', (segments) => {
					for (const segment of segments) {
						const newSegment = new UISegment(this.store, this, segment._id)
						this.segments.set(newSegment.id, newSegment)
						newSegment.updateFromJson(segment)
					}
				})
			)

		// get all segments

		// register callbacks for events

		// we track playlist changed and removed
		this.store.connection.playlist.on('changed', (json: RundownPlaylist) => {})

		this.store.connection.playlist.on('removed', (json: RundownPlaylist) => {})

		// we track rundown created, changed and removed, because we own Rundowns
		this.store.connection.rundown.on('created', (json: Rundown) => {})

		this.store.connection.rundown.on('changed', (json: Rundown) => {})

		this.store.connection.rundown.on('removed', (json: Rundown) => {})

		// we track segment created so that we can add new Segments when they are added
		this.store.connection.segment.on('created', (json: Segment) => {})
	}

	updateFromJson(json: RundownPlaylist) {
		this.name = json.label
		this.ready = true
	}

	get segmentsInOrder(): UISegment[] {
		return Array.from(this.segments.values()).sort((a, b) => {
			if (a.rundownId === b.rundownId) return a.rank - b.rank
			const rundownRankA = a.rundownId ? this.rundowns.get(a.rundownId)?.rank ?? 0 : 0
			const rundownRankB = b.rundownId ? this.rundowns.get(b.rundownId)?.rank ?? 0 : 0
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
