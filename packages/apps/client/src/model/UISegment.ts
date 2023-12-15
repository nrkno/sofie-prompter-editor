import { action, computed, makeAutoObservable, observable } from 'mobx'
import { ProtectedString, RundownId, Segment, SegmentId, protectString } from '@sofie-prompter-editor/shared-model'
import { UILineId, UILine } from './UILine'
import { RundownStore } from '../stores/RundownStore'
import { randomId } from '../lib/lib'
import { UIRundown } from './UIRundown'

export class UISegment {
	rank: number = 0

	name: string = ''

	ready: boolean = false

	rundownId: RundownId | null = null

	lines = observable.map<UILineId, UILine>([])

	constructor(
		private store: RundownStore,
		private owner: UIRundown,
		public segmentId: SegmentId,
		public id = protectString<UISegmentId>(randomId())
	) {
		makeAutoObservable(this, {
			updateFromJson: action,
			linesInOrder: computed,
			remove: action,
		})

		this.store.connection.parts
			.find({
				query: {
					segmentId: this.segmentId,
				},
			})
			.then(
				action('receiveParts', (parts) => {
					for (const part of parts) {
						const newPart = new UILine(this.store, this, part._id)
						this.lines.set(newPart.id, newPart)
						newPart.updateFromJson(part)
					}
				})
			)

		this.store.connection.segment.on('changed', (json: Segment) => {
			if (this.segmentId !== json._id) return

			this.updateFromJson(json)
		})

		this.store.connection.segment.on('removed', (json: Segment) => {
			if (this.segmentId !== json._id) return

			this.remove()
		})

		// we track segment created so that we can add new Segments when they are added
		this.store.connection.parts.on('created', (json) => {
			if (json.segmentId !== this.segmentId) return

			const newPart = new UILine(this.store, this, json._id)
			this.lines.set(newPart.id, newPart)
			newPart.updateFromJson(json)
		})
	}

	updateFromJson(json: Segment) {
		this.name = json.label
		this.rank = json.rank
		this.rundownId = json.rundownId

		this.ready = true
	}

	get linesInOrder(): UILine[] {
		return Array.from(this.lines.values())
			.slice()
			.sort((a, b) => a.rank - b.rank)
	}

	remove(): void {
		this.owner.segments.delete(this.id)
		this.dispose()
	}

	dispose(): void {
		// unregister event handlers
	}
}

export type UISegmentId = ProtectedString<'UISegmentId', string>
