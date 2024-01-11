import { action, computed, makeAutoObservable, observable } from 'mobx'
import {
	Rundown,
	RundownId,
	RundownPlaylist,
	RundownPlaylistId,
	Segment,
	SegmentId,
} from '@sofie-prompter-editor/shared-model'
import { UISegment } from './UISegment'
import { RundownStore } from '../stores/RundownStore'

export class UIRundown {
	name: string = ''

	ready: boolean = false

	segments = observable.map<SegmentId, UISegment>()

	private rundowns = observable.map<RundownId, Rundown>()

	constructor(private store: RundownStore, public id: RundownPlaylistId) {
		makeAutoObservable(this, {
			updateFromJson: action,
			segmentsInOrder: computed,
			close: action,
		})
		this.init().catch(console.error)
	}
	async init() {
		await this.store.connection.rundown.subscribeToRundownsInPlaylist(this.id)

		const rundowns = await this.store.connection.rundown.find({
			query: {
				playlistId: this.id,
			},
		})
		for (const rundown of rundowns) {
			this._onRundownCreated(rundown)
		}

		const segments = await this.store.connection.segment.find({
			query: {
				playlistId: this.id,
			},
		})
		for (const segment of segments) {
			this._onSegmentCreated(segment)
		}

		// get all segments

		// register callbacks for events

		// we track playlist changed and removed
		this.store.connection.playlist.on('updated', (json: RundownPlaylist) => {
			if (json._id !== this.id) return

			this.updateFromJson(json)
		})

		this.store.connection.playlist.on('removed', (id: RundownPlaylistId) => {
			if (id !== this.id) return

			this.close()
		})

		// we track rundown created, changed and removed, because we own Rundowns
		this.store.connection.rundown.on('created', (json: Rundown) => {
			this.rundowns.set(json._id, json)
		})

		this.store.connection.rundown.on('updated', (json: Rundown) => {
			this.rundowns.set(json._id, json)
		})

		this.store.connection.rundown.on('removed', (json) => {
			this.rundowns.delete(json._id)
		})

		// we track segment created so that we can add new Segments when they are added
		this.store.connection.segment.on('created', (json: Segment) => {
			if (json.playlistId !== this.id) return
			if (!this.rundowns.has(json.rundownId)) return

			this._onSegmentCreated(json)
		})
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
	private _onRundownCreated = action('onRundownCreated', (json: Rundown) => {
		this.rundowns.set(json._id, json)
	})
	private _onSegmentCreated = action('onSegmentCreated', (json: Segment) => {
		console.log('individual segment', json._id, json)

		const existing = this.segments.get(json._id)
		if (!existing) {
			const newSegment = new UISegment(this.store, this, json._id)
			this.segments.set(json._id, newSegment)
			newSegment.updateFromJson(json)
		} else {
			// update existing segment

			existing.updateFromJson(json)
		}
	})
}
