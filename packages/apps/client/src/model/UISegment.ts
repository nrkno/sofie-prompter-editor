import { action, computed, makeAutoObservable, observable } from 'mobx'
import { Part, PartId, RundownId, Segment, SegmentId } from '@sofie-prompter-editor/shared-model'
import { UILine } from './UILine'
import { RundownStore } from '../stores/RundownStore'
import { UIRundown } from './UIRundown'

export type UISegmentId = SegmentId

export class UISegment {
	rank: number = 0

	name: string = ''

	ready: boolean = false

	rundownId: RundownId | null = null

	lines = observable.map<PartId, UILine>([])

	// static GetRandomID() {
	// 	return protectString<UISegmentId>(randomId())
	// }
	constructor(private store: RundownStore, private owner: UIRundown, public id: UISegmentId) {
		makeAutoObservable(this, {
			updateFromJson: action,
			linesInOrder: computed,
			remove: action,
		})

		this.init().catch(console.error)

		this.store.connection.segment.on('updated', this.onSegmentUpdated)

		this.store.connection.segment.on('removed', this.onSegmentRemoved)

		// we track segment created so that we can add new Segments when they are added
		this.store.connection.part.on('created', this.onPartCreated)
	}

	private async init() {
		const parts = await this.store.connection.part.find({
			query: {
				segmentId: this.id,
			},
		})

		for (const part of parts) {
			this.onPartCreated(part)
		}
	}

	updateFromJson(json: Segment) {
		this.name = json.label
		this.rank = json.rank
		this.rundownId = json.rundownId

		this.ready = true
	}

	get linesInOrder(): UILine[] {
		return Array.from(this.lines.values()).sort((a, b) => a.rank - b.rank)
	}

	get linesInOrderFiltered(): UILine[] {
		let lines = Array.from(this.lines.values())
		if (this.owner.filter) lines = lines.filter(this.doesLineMatchFilter)
		return lines.sort((a, b) => a.rank - b.rank)
	}

	private doesLineMatchFilter = (line: UILine): boolean => {
		if (this.owner.filter === null) return true
		if (this.owner.filter === 'onlyScript') {
			if (line.script === null || line.script.trim() === '') return false
			return true
		}
		return true
	}

	private onPartCreated = action('onPartCreated', (json: Part) => {
		if (json.segmentId !== this.id) return

		const existing = this.lines.get(json._id)
		if (!existing) {
			const newPart = new UILine(this.store, this, json._id)
			newPart.updateFromJson(json)
			this.lines.set(newPart.id, newPart)
			return
		}

		existing.updateFromJson(json)
	})

	public onSegmentRemoved = action('onSegmentRemoved', (json: Pick<Segment, '_id'>) => {
		if (this.id !== json._id) return

		this.remove()
	})

	private onSegmentUpdated = action('onSegmentUpdated', (json: Segment) => {
		if (this.id !== json._id) return

		this.updateFromJson(json)
	})

	remove(): void {
		this.owner.segments.delete(this.id)
		this.dispose()
	}

	dispose(): void {
		this.lines.forEach((line) => line.dispose())

		// unregister event handlers
		this.store.connection.segment.off('updated', this.onSegmentUpdated)
		this.store.connection.segment.off('removed', this.onSegmentRemoved)
		this.store.connection.part.off('created', this.onPartCreated)
	}
}
