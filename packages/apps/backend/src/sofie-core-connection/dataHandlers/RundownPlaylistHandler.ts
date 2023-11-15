import { Collection, CoreConnection, protectString } from '@sofie-automation/server-core-integration'
import { RundownPlaylist, RundownPlaylistId } from '@sofie-prompter-editor/shared-model'
import { LoggerInstance } from '../../lib/logger.js'
import { Store } from '../../data-stores/Store.js'
import * as Core from './tmpCoreDataTypes/index.js'
import { DataHandler } from './DataHandler.js'

export class RundownPlaylistHandler extends DataHandler {
	public initialized: Promise<void>
	constructor(log: LoggerInstance, core: CoreConnection, store: Store) {
		super(log.category('RundownPlaylistHandler'), core, store)

		this.initialized = Promise.resolve().then(async () => {
			const observer = this.core.observe('rundownPlaylists')
			observer.added = (id: string) => this.onAdded(protectString(id))
			observer.changed = (id: string) => this.onChanged(protectString(id))
			observer.removed = (id: string) => this.onRemoved(protectString(id))
			this.observers.push(observer)

			await this.core.autoSubscribe('rundownPlaylists', {})
		})
	}
	private onAdded(id: Core.RundownPlaylistId): void {
		this.log.info('onAdded ' + id)
		const playlist = this.collection.findOne(id)

		if (!playlist) {
			this.store.playlists.remove(this.convertId(id))
		} else {
			this.store.playlists.create(this.convert(playlist))
		}
	}
	private onChanged(id: Core.RundownPlaylistId): void {
		this.log.info('onChanged ' + id)
		const playlist = this.collection.findOne(id)

		if (!playlist) {
			this.store.playlists.remove(this.convertId(id))
		} else {
			this.store.playlists.update(this.convert(playlist))
		}
	}
	private onRemoved(id: Core.RundownPlaylistId): void {
		this.log.info('onRemoved ' + id)
		this.store.playlists.remove(this.convertId(id))
	}

	private convert(corePlaylist: Core.DBRundownPlaylist): RundownPlaylist {
		return {
			_id: this.convertId(corePlaylist._id),
			label: corePlaylist.name,
			created: corePlaylist.created,
			modified: corePlaylist.modified,
			isActive: Boolean(corePlaylist.activationId),
			rehearsal: Boolean(corePlaylist.rehearsal),
			startedPlayback: corePlaylist.startedPlayback,
		}
	}
	private convertId(id: Core.RundownPlaylistId): RundownPlaylistId {
		return id as any
	}

	private get collection(): Collection<Core.DBRundownPlaylist> {
		const collection = this.core.getCollection<Core.DBRundownPlaylist>('rundownPlaylists')
		if (!collection) {
			this.log.error('collection "peripheralDevices" not found!')
			throw new Error('collection "peripheralDevices" not found!')
		}
		return collection
	}
}