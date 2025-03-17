import { IReactionDisposer, action, computed, makeAutoObservable, observable } from 'mobx'
import {
	PartId,
	Rundown,
	RundownId,
	RundownPlaylist,
	RundownPlaylistId,
	ScriptContents,
	Segment,
	SegmentId,
} from '@sofie-prompter-editor/shared-model'
import { UISegment } from './UISegment'
import { RundownStore } from '../stores/RundownStore'
import { UILineId } from './UILine'

export type UIRundownId = RundownPlaylistId

type UIRundownFilter = 'onlyScript' | null

export class UIRundown {
	name: string = ''

	ready: boolean = false

	segments = observable.map<SegmentId, UISegment>()

	private rundowns = observable.map<RundownId, Rundown>()

	filter: UIRundownFilter = null

	editorCaretPositionLineId: UILineId | null = null

	reactions: IReactionDisposer[] = []

	constructor(private store: RundownStore, public id: UIRundownId) {
		makeAutoObservable(this, {
			segmentsInOrder: computed,
		})
		this.init()
	}
	private init = action(() => {
		this.reactions.push(
			this.store.appStore.whenConnected(async () => {
				// Setup subscription and load initial data:
				const { rundowns, segments } = await this.store.connection.rundown.subscribeToRundownsInPlaylist(this.id)

				// Remove old data:
				for (const rundownId of this.rundowns.keys()) {
					if (!rundowns.find((r) => r._id === rundownId)) {
						this.onRundownRemoved({ _id: rundownId })
					}
				}
				for (const [segmentId, segment] of this.segments.entries()) {
					if (!segments.find((s) => s._id === segmentId)) segment.remove()
				}

				// Add new data:
				for (const rundown of rundowns) {
					this.onRundownCreated(rundown)
				}
				for (const segment of segments) {
					this.onSegmentCreated(segment)
				}
			})
		)

		// Register callbacks for events:

		// we track playlist changed and removed
		this.store.connection.playlist.on('updated', this.onPlaylistUpdated)
		this.store.connection.playlist.on('removed', this.onPlaylistRemoved)

		// we track rundown created, changed and removed, because we own Rundowns
		this.store.connection.rundown.on('created', this.onRundownCreated)
		this.store.connection.rundown.on('updated', this.onRundownCreated)
		this.store.connection.rundown.on('removed', this.onRundownRemoved)

		// we track segment created so that we can add new Segments when they are added
		this.store.connection.segment.on('created', this.onSegmentCreated)
	})

	private onPlaylistUpdated = (json: RundownPlaylist) => {
		if (json._id !== this.id) return
		this.updateFromJson(json)
	}

	private onPlaylistRemoved = (id: RundownPlaylistId) => {
		if (id !== this.id) return

		if (this.store.openRundown?.id === this.id) this.store.closeRundown()
		this.dispose()
	}
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

	get segmentsInOrderFiltered(): UISegment[] {
		return this.segmentsInOrder
	}

	setFilter = action((filter: UIRundownFilter) => {
		this.filter = filter
	})

	dispose = action(() => {
		// unregister event handlers from services
		this.store.connection.rundown.unSubscribeFromRundownsInPlaylist(this.id).catch(console.error)
		this.store.connection.segment.off('created', this.onSegmentCreated)
		this.segments.forEach((segment) => segment.dispose())
		this.reactions.forEach((dispose) => dispose())
	})

	private onRundownCreated = action('onRundownCreated', (json: Rundown) => {
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

	updatePartWithCaret = action('updatePartWithCaret', (partId: PartId | null) => {
		this.editorCaretPositionLineId = partId
	})

	async updatePartScript(partId: PartId, script: ScriptContents): Promise<void> {
		await this.store.connection.part.updateScript({
			partId,
			script,
		})
	}
}
