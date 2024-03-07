import { Collection, CoreConnection, protectString } from '@sofie-automation/server-core-integration'
import { LoggerInstance } from '../../lib/logger.js'
import { Store } from '../../data-stores/Store.js'
import * as Core from '../CoreDataTypes/index.js'
import { DataHandler } from './DataHandler.js'
import { Transformers } from '../dataTransformers/Transformers.js'

export class ExpectedPackageHandler extends DataHandler {
	public initialized: Promise<void>

	constructor(log: LoggerInstance, core: CoreConnection, store: Store, transformers: Transformers) {
		super(log.category('ExpectedPackageHandler'), core, store, transformers)

		this.initialized = Promise.resolve().then(async () => {
			const observer = this.core.observe('expectedPackages')
			observer.added = (id: string) => this._updateExpectedPackage(protectString(id))
			observer.changed = (id: string) => this._updateExpectedPackage(protectString(id))
			observer.removed = (id: string) => this._updateExpectedPackage(protectString(id))
			this.observers.push(observer)
		})
	}

	private _updateExpectedPackage(packageId: Core.ExpectedPackageId): void {
		const expectedPackage = this.expectedPackages.findOne(packageId)
		this.transformers.expectedPackages.updateCoreExpectedPackage(packageId, expectedPackage)
	}
	private get expectedPackages(): Collection<Core.ExpectedPackageDB> {
		const collection = this.core.getCollection<Core.ExpectedPackageDB>('expectedPackages')
		if (!collection) {
			this.log.error('collection "expectedPackages" not found!')
			throw new Error('collection "expectedPackages" not found!')
		}
		return collection
	}
}
