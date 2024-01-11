import { action, computed, makeAutoObservable, observable } from 'mobx'
import {
	PartId,
	ProtectedString,
	RundownId,
	Segment,
	SegmentId,
	protectString,
} from '@sofie-prompter-editor/shared-model'
import { UILine } from './UILine'
import { RundownStore } from '../stores/RundownStore'
import { UIRundown } from './UIRundown'

export class UISegment {
	rank: number = 0

	name: string = ''

	ready: boolean = false

	rundownId: RundownId | null = null

	lines = observable.map<PartId, UILine>([])

	// static GetRandomID() {
	// 	return protectString<UISegmentId>(randomId())
	// }
	constructor(private store: RundownStore, private owner: UIRundown, public id: SegmentId) {
		makeAutoObservable(this, {
			updateFromJson: action,
			linesInOrder: computed,
			remove: action,
		})

		console.log(`Created new UISegment: ${id}`, new Error().stack)

		this.store.connection.part
			.find({
				query: {
					segmentId: this.id,
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

		this.store.connection.segment.on(
			'updated',
			action('segmentUpdated', (json: Segment) => {
				if (this.id !== json._id) return

				this.updateFromJson(json)
			})
		)

		this.store.connection.segment.on(
			'removed',
			action('segmentRemoved', (json) => {
				if (this.id !== json._id) return

				this.remove()
			})
		)

		// we track segment created so that we can add new Segments when they are added
		this.store.connection.part.on(
			'created',
			action('createPart', (json) => {
				if (json.segmentId !== this.id) return

				const newPart = new UILine(this.store, this, json._id)
				this.lines.set(newPart.id, newPart)
				newPart.updateFromJson(json)
			})
		)
	}

	updateFromJson(json: Segment) {
		console.log(`Updated UISegment: ${this.id}`)

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
