import { Collection, CoreConnection, protectString } from '@sofie-automation/server-core-integration'
import { LoggerInstance } from '../../lib/logger.js'
import { Store } from '../../data-stores/Store.js'
import * as Core from '../CoreDataTypes/index.js'
import { DataHandler } from './DataHandler.js'
import { Transformers } from '../dataTransformers/Transformers.js'

export class PartHandler extends DataHandler {
	public initialized: Promise<void>

	constructor(log: LoggerInstance, core: CoreConnection, store: Store, transformers: Transformers) {
		super(log.category('PartHandler'), core, store, transformers)

		this.initialized = Promise.resolve().then(async () => {
			{
				const observer = this.core.observe('parts')
				observer.added = (id: string) => this._updatePart(protectString(id))
				observer.changed = (id: string) => this._updatePart(protectString(id))
				observer.removed = (id: string) => this._updatePart(protectString(id))
				this.observers.push(observer)
			}
		})
	}

	private _updatePart(partId: Core.PartId): void {
		this.transformers.parts.updateCorePart(partId, this.parts.findOne(partId))
	}
	private get parts(): Collection<Core.DBPart> {
		const collection = this.core.getCollection<Core.DBPart>('parts')
		if (!collection) {
			this.log.error('collection "parts" not found!')
			throw new Error('collection "parts" not found!')
		}
		return collection
	}
}
