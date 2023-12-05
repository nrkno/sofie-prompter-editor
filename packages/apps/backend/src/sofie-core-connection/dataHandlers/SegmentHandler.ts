import { Collection, CoreConnection, protectString } from '@sofie-automation/server-core-integration'
import { AnyProtectedString, RundownId, Segment, SegmentId } from '@sofie-prompter-editor/shared-model'
import { LoggerInstance } from '../../lib/logger.js'
import { Store } from '../../data-stores/Store.js'
import * as Core from './tmpCoreDataTypes/index.js'
import { DataHandler } from './DataHandler.js'

export class SegmentHandler extends DataHandler {
	public initialized: Promise<void>
	constructor(log: LoggerInstance, core: CoreConnection, store: Store) {
		super(log.category('SegmentHandler'), core, store)

		this.initialized = Promise.resolve().then(async () => {
			const observer = this.core.observe('segments')
			observer.added = (id: string) => this.onAdded(protectString(id))
			observer.changed = (id: string) => this.onChanged(protectString(id))
			observer.removed = (id: string) => this.onRemoved(protectString(id))
			this.observers.push(observer)
		})
	}
	private onAdded(id: Core.SegmentId): void {
		this.log.info('onAdded ' + id)
		const segment = this.collection.findOne(id)

		if (!segment) {
			this.store.segments.remove(this.convertId(id))
		} else {
			const s = this.convert(segment)
			if (s.segment) this.store.segments.create(s.segment)
			else this.store.segments.remove(s._id)
		}
	}
	private onChanged(id: Core.SegmentId): void {
		this.log.info('onChanged ' + id)
		const segment = this.collection.findOne(id)

		if (!segment) {
			this.store.segments.remove(this.convertId(id))
		} else {
			const s = this.convert(segment)
			if (s.segment) this.store.segments.update(s.segment)
			else this.store.segments.remove(s._id)
		}
	}
	private onRemoved(id: Core.SegmentId): void {
		this.log.info('onRemoved ' + id)
		this.store.segments.remove(this.convertId<Core.SegmentId, SegmentId>(id))
	}

	private convert(coreSegment: Core.DBSegment): { _id: SegmentId; segment: Segment | null } {
		const segmentId = this.convertId<Core.SegmentId, SegmentId>(coreSegment._id)
		const rundownId = this.convertId<Core.RundownId, RundownId>(coreSegment.rundownId)
		const rundown = this.store.rundowns.rundowns.get(rundownId)
		if (!rundown) return { _id: segmentId, segment: null }

		return {
			_id: segmentId,
			segment: {
				_id: segmentId,

				playlistId: rundown?.playlistId,
				rundownId: rundownId,
				label: coreSegment.name,
				rank: coreSegment._rank,
				isHidden: coreSegment.isHidden,
			},
		}
	}
	private convertId<A extends Core.ProtectedString<any>, B extends AnyProtectedString>(id: A): B {
		return id as any
	}

	private get collection(): Collection<Core.DBSegment> {
		const collection = this.core.getCollection<Core.DBSegment>('segments')
		if (!collection) {
			this.log.error('collection "segments" not found!')
			throw new Error('collection "segments" not found!')
		}
		return collection
	}
}
