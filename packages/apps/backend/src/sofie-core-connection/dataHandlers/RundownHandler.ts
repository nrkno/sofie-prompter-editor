import { Collection, CoreConnection, protectString } from '@sofie-automation/server-core-integration'
import { AnyProtectedString, Rundown, RundownId, RundownPlaylistId } from '@sofie-prompter-editor/shared-model'
import { LoggerInstance } from '../../lib/logger.js'
import { Store } from '../../data-stores/Store.js'
import * as Core from './tmpCoreDataTypes/index.js'
import { DataHandler } from './DataHandler.js'

export class RundownHandler extends DataHandler {
	public initialized: Promise<void>
	constructor(log: LoggerInstance, core: CoreConnection, store: Store) {
		super(log.category('RundownHandler'), core, store)

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
		const rundown = this.collection.findOne(id)

		if (!rundown) {
			this.store.rundowns.remove(this.convertId(id))
		} else {
			this.store.rundowns.create(this.convert(rundown))
		}
	}
	private onChanged(id: Core.RundownId): void {
		this.log.info('onChanged ' + id)
		const rundown = this.collection.findOne(id)

		if (!rundown) {
			this.store.rundowns.remove(this.convertId(id))
		} else {
			this.store.rundowns.update(this.convert(rundown))
		}
	}
	private onRemoved(id: Core.RundownId): void {
		this.log.info('onRemoved ' + id)
		this.store.rundowns.remove(this.convertId(id))
	}

	private convert(coreRundown: Core.DBRundown): Rundown {
		return {
			_id: this.convertId<Core.RundownId, RundownId>(coreRundown._id),

			playlistId: this.convertId<Core.RundownPlaylistId, RundownPlaylistId>(coreRundown.playlistId),
			label: coreRundown.name,
			rank: 0, // todo
		}
	}
	private convertId<A extends Core.ProtectedString<any>, B extends AnyProtectedString>(id: A): B {
		return id as any
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
