import { IReactionDisposer, action, computed, flow, makeObservable, observable, reaction, when } from 'mobx'
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

	reactions: IReactionDisposer[] = []

	constructor(private store: RundownStore, public id: UIRundownId) {
		makeObservable(this, {
			segmentsInOrder: computed,
			close: action,
		})
		this.init().catch(console.error)
	}
	init = flow(function* (this: UIRundown) {
		this.reactions.push(
			reaction(
				() => this.store.appStore.connected,
				async (connected) => {
					if (!connected) return

					await this.store.connection.rundown.subscribeToRundownsInPlaylist(this.id)
				},
				{
					fireImmediately: true,
				}
			)
		)

		const rundowns = yield this.store.connection.rundown.find({
			query: {
				playlistId: this.id,
			},
		})
		for (const rundown of rundowns) {
			this.onRundownCreated(rundown)
		}

		const segments = yield this.store.connection.segment.find({
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
		this.store.connection.playlist.on('updated', this.onPlaylistUpdated)
		this.store.connection.playlist.on('removed', this.onPlaylistRemoved)

		// we track rundown created, changed and removed, because we own Rundowns
		this.store.connection.rundown.on('created', this.onRundownCreated)
		this.store.connection.rundown.on('updated', this.onRundownUpdated)
		this.store.connection.rundown.on('removed', this.onRundownRemoved)

		// we track segment created so that we can add new Segments when they are added
		this.store.connection.segment.on('created', this.onSegmentCreated)
	})

	updateFromJson = action('updateFromJson', (json: RundownPlaylist) => {
		this.name = json.label
		this.ready = true
	})

	get segmentsInOrder(): UISegment[] {
		return Array.from(this.segments.values()).sort((a, b) => {
			if (a.rundownId === b.rundownId) return a.rank - b.rank
			const rundownRankA = a.rundownId ? this.rundowns.get(a.rundownId)?.rank ?? 0 : 0
			const rundownRankB = b.rundownId ? this.rundowns.get(b.rundownId)?.rank ?? 0 : 0
			return rundownRankA - rundownRankB
		})
	}

	close = action('close', () => {
		this.store.openRundown = null

		this.store.connection.rundown.unSubscribeFromRundownsInPlaylist(this.id).catch(console.error)
		this.dispose()
	})

	dispose(): void {
		this.reactions.forEach((destroy) => destroy())

		this.store.connection.playlist.off('updated', this.onPlaylistUpdated)
		this.store.connection.playlist.off('removed', this.onPlaylistRemoved)

		this.store.connection.rundown.off('created', this.onRundownCreated)
		this.store.connection.rundown.off('updated', this.onRundownUpdated)
		this.store.connection.rundown.off('removed', this.onRundownRemoved)

		this.store.connection.segment.off('created', this.onSegmentCreated)
	}

	private onPlaylistUpdated = action('onPlaylistUpdated', (json: RundownPlaylist) => {
		if (json._id !== this.id) return

		this.updateFromJson(json)
	})
	private onPlaylistRemoved = action('onPlaylistRemoved', (id: RundownPlaylistId) => {
		if (id !== this.id) return

		this.close()
	})
	private onRundownCreated = action('onRundownCreated', (json: Rundown) => {
		if (json.playlistId !== this.id) return

		this.rundowns.set(json._id, json)
	})
	private onRundownUpdated = action('onRundownUpdated', (json: Rundown) => {
		if (json.playlistId !== this.id) return

		this.rundowns.set(json._id, json)
	})
	private onRundownRemoved = action('onRundownRemoved', (json: Pick<Rundown, '_id'>) => {
		this.rundowns.delete(json._id)
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
