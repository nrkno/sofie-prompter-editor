import { Collection, CoreConnection, protectString } from '@sofie-automation/server-core-integration'
import { LoggerInstance } from '../../lib/logger.js'
import { Store } from '../../data-stores/Store.js'
import * as Core from '../CoreDataTypes/index.js'
import { DataHandler } from './DataHandler.js'
import { Transformers } from '../dataTransformers/Transformers.js'

export class RundownHandler extends DataHandler {
	public initialized: Promise<void>
	constructor(log: LoggerInstance, core: CoreConnection, store: Store, transformers: Transformers) {
		super(log.category('RundownHandler'), core, store, transformers)

		this.initialized = Promise.resolve().then(async () => {
			const observer = this.core.observe('rundowns')
			observer.added = (id: string) => this.onAdded(protectString(id))
			observer.changed = (id: string) => this.onChanged(protectString(id))
			observer.removed = (id: string) => this.onRemoved(protectString(id))
			this.observers.push(observer)
		})
	}
	private onAdded(id: Core.RundownId): void {
		this.log.info('onAdded ' + id)
		this.transformers.rundowns.updateCoreRundown(id, this.collection.findOne(id))
	}
	private onChanged(id: Core.RundownId): void {
		this.log.info('onChanged ' + id)
		this.transformers.rundowns.updateCoreRundown(id, this.collection.findOne(id))
	}
	private onRemoved(id: Core.RundownId): void {
		this.log.info('onRemoved ' + id)
		this.transformers.rundowns.updateCoreRundown(id, undefined)
	}

	private get collection(): Collection<Core.DBRundown> {
		const collection = this.core.getCollection<Core.DBRundown>('rundowns')
		if (!collection) {
			this.log.error('collection "rundowns" not found!')
			throw new Error('collection "rundowns" not found!')
		}
		return collection
	}
}
