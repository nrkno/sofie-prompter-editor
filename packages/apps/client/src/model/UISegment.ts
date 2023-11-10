import { computed, makeAutoObservable, observable, values } from 'mobx'
import { ProtectedString, Segment, SegmentId, protectString } from 'packages/shared/model/dist'
import { UILineId, UILine } from './UILine'
import { RundownStore } from '../stores/RundownStore'
import { randomId } from '../lib/lib'

export class UISegment {
	rank: number = 0

	name: string = ''

	ready: boolean = false

	lines = observable.map<UILineId, UILine>([])

	constructor(
		private store: RundownStore,
		public segmentId: SegmentId,
		public id = protectString<UISegmentId>(randomId())
	) {
		makeAutoObservable(this, {
			lineIdsInOrder: computed,
		})

		// fetch owned parts and register event handlers for parts
	}

	updateFromJson(json: Segment) {
		this.name = json.label
		this.rank = json.rank

		this.ready = true
	}

	get lineIdsInOrder(): UILineId[] {
		return values(this.lines).slice().sort((a, b) => a.rank - b.rank).map((line) => line.id)
	}

	remove(): void {
		this.store.openRundown?.segments.delete(this.id)
		// unregister event handlers
	}
}

export type UISegmentId = ProtectedString<'UISegmentId', string>
