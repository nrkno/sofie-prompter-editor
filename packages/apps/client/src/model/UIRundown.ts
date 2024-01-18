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

export type UIRundownId = RundownPlaylistId

export class UIRundown {
	name: string = ''

	ready: boolean = false

	segments = observable.map<SegmentId, UISegment>()

	private rundowns = observable.map<RundownId, Rundown>()

	constructor(private store: RundownStore, public id: UIRundownId) {
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
			this.onRundownCreated(rundown)
		}

		const segments = await this.store.connection.segment.find({
			query: {
				playlistId: this.id,
			},
		})
		for (const segment of segments) {
			this.onSegmentCreated(segment)
		}

		// get all segments

		// register callbacks for events

		// we track playlist changed and removed
		this.store.connection.playlist.on(
			'updated',
			action((json: RundownPlaylist) => {
				if (json._id !== this.id) return

				this.updateFromJson(json)
			})
		)

		this.store.connection.playlist.on(
			'removed',
			action((id: RundownPlaylistId) => {
				if (id !== this.id) return

				this.close()
			})
		)

		// we track rundown created, changed and removed, because we own Rundowns
		this.store.connection.rundown.on(
			'created',
			action((json: Rundown) => {
				this.rundowns.set(json._id, json)
			})
		)

		this.store.connection.rundown.on(
			'updated',
			action((json: Rundown) => {
				this.rundowns.set(json._id, json)
			})
		)

		this.store.connection.rundown.on(
			'removed',
			action((json) => {
				this.rundowns.delete(json._id)
			})
		)

		// we track segment created so that we can add new Segments when they are added
		this.store.connection.segment.on('created', this.onSegmentCreated)
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

		this.store.connection.rundown.unSubscribeFromRundownsInPlaylist(this.id).catch(console.error)
		this.dispose()
	}

	dispose(): void {
		// unregister event handlers from services
		this.store.connection.segment.off('created', this.onSegmentCreated)

		// TODO: Add more handlers
	}
	private onRundownCreated = action('onRundownCreated', (json: Rundown) => {
		this.rundowns.set(json._id, json)
	})
	private onSegmentCreated = action('onSegmentCreated', (json: Segment) => {
		if (json.playlistId !== this.id) return
		if (!this.rundowns.has(json.rundownId)) return

		const existing = this.segments.get(json._id)

		if (!existing) {
			const newSegment = new UISegment(this.store, this, json._id)
			newSegment.updateFromJson(json)
			this.segments.set(json._id, newSegment)
			return
		}

		// update existing segment
		existing.updateFromJson(json)
	})
}
