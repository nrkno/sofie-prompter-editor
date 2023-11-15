import { action, computed, makeAutoObservable, observable, values } from 'mobx'
import { ProtectedString, RundownId, Segment, SegmentId, protectString } from '@sofie-prompter-editor/shared-model'
import { UILineId, UILine } from './UILine'
import { RundownStore } from '../stores/RundownStore'
import { randomId } from '../lib/lib'

export class UISegment {
	rank: number = 0

	name: string = ''

	ready: boolean = false

	rundownId: RundownId | null = null

	lines = observable.map<UILineId, UILine>([])

	constructor(
		private store: RundownStore,
		public segmentId: SegmentId,
		public id = protectString<UISegmentId>(randomId())
	) {
		makeAutoObservable(this, {
			linesInOrder: computed,
		})

		this.store.connection.parts
			.find({
				query: {
					segmentId: this.segmentId,
				},
			})
			.then(
				action('loadParts', (parts) => {
					for (const part of parts) {
						const newPart = new UILine(this.store, part._id)
						this.lines.set(newPart.id, newPart)
						newPart.updateFromJson(part)
					}
				})
			)

		// fetch owned parts and register event handlers for parts
	}

	updateFromJson(json: Segment) {
		this.name = json.label
		this.rank = json.rank
		this.rundownId = json.rundownId

		this.ready = true
	}

	get linesInOrder(): UILine[] {
		return values(this.lines)
			.slice()
			.sort((a, b) => a.rank - b.rank)
	}

	remove(): void {
		this.store.openRundown?.segments.delete(this.id)
		// unregister event handlers
	}
}

export type UISegmentId = ProtectedString<'UISegmentId', string>
