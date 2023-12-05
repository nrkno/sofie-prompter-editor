import { Collection, CoreConnection, protectString } from '@sofie-automation/server-core-integration'
import {
	AnyProtectedString,
	RundownId,
	Part,
	PartId,
	SegmentId,
	PartDisplayType,
} from '@sofie-prompter-editor/shared-model'
import { LoggerInstance } from '../../lib/logger.js'
import { Store } from '../../data-stores/Store.js'
import * as Core from './tmpCoreDataTypes/index.js'
import { DataHandler } from './DataHandler.js'

export class PartHandler extends DataHandler {
	public initialized: Promise<void>
	constructor(log: LoggerInstance, core: CoreConnection, store: Store) {
		super(log.category('PartHandler'), core, store)

		this.initialized = Promise.resolve().then(async () => {
			const observer = this.core.observe('parts')
			observer.added = (id: string) => this.onAdded(protectString(id))
			observer.changed = (id: string) => this.onChanged(protectString(id))
			observer.removed = (id: string) => this.onRemoved(protectString(id))
			this.observers.push(observer)
		})
	}
	private onAdded(id: Core.PartId): void {
		this.log.info('onAdded ' + id)
		const part = this.collection.findOne(id)

		if (!part) {
			this.store.parts.remove(this.convertId(id))
		} else {
			const s = this.convert(part)
			if (s.part) this.store.parts.create(s.part)
			else this.store.parts.remove(s._id)
		}
	}
	private onChanged(id: Core.PartId): void {
		this.log.info('onChanged ' + id)
		const part = this.collection.findOne(id)

		if (!part) {
			this.store.parts.remove(this.convertId(id))
		} else {
			const s = this.convert(part)
			if (s.part) this.store.parts.update(s.part)
			else this.store.parts.remove(s._id)
		}
	}
	private onRemoved(id: Core.PartId): void {
		this.log.info('onRemoved ' + id)
		this.store.parts.remove(this.convertId<Core.PartId, PartId>(id))
	}

	private convert(corePart: Core.DBPart): { _id: PartId; part: Part | null } {
		const partId = this.convertId<Core.PartId, PartId>(corePart._id)
		const rundownId = this.convertId<Core.RundownId, RundownId>(corePart.rundownId)
		const rundown = this.store.rundowns.rundowns.get(rundownId)
		if (!rundown) return { _id: partId, part: null }

		return {
			_id: partId,
			part: {
				_id: partId,

				playlistId: rundown?.playlistId,
				rundownId: rundownId,
				segmentId: this.convertId<Core.SegmentId, SegmentId>(corePart.segmentId),
				label: corePart.title,
				rank: corePart._rank,

				isOnAir: false, // TODO
				isNext: false, // TODO
				display: {
					label: '', // TODO
					type: PartDisplayType.FULL, // TODO
				},
			},
		}
	}
	private convertId<A extends Core.ProtectedString<any>, B extends AnyProtectedString>(id: A): B {
		return id as any
	}

	private get collection(): Collection<Core.DBPart> {
		const collection = this.core.getCollection<Core.DBPart>('parts')
		if (!collection) {
			this.log.error('collection "parts" not found!')
			throw new Error('collection "parts" not found!')
		}
		return collection
	}
}
