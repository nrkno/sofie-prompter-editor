import EventEmitter from 'eventemitter3'
import { Application, PaginationParams, Params } from '@feathersjs/feathers'
import {
	ServiceTypes,
	Services,
	RundownServiceDefinition as Definition,
	RundownPlaylistId,
} from '@sofie-prompter-editor/shared-model'
import { PublishChannels } from '../PublishChannels.js'
import { CustomFeathersService } from './lib.js'
import { Store } from '../../data-stores/Store.js'
import { Lambda, observe } from 'mobx'
import { LoggerInstance } from '../../lib/logger.js'
import { NotFound, NotImplemented } from '@feathersjs/errors'
import { SofieCoreConnection } from '../../sofie-core-connection/SofieCoreConnection.js'

export type RundownFeathersService = CustomFeathersService<Definition.Service, Definition.Events>

/** The methods exposed by this class are exposed in the API */
export class RundownService extends EventEmitter<Definition.Events> implements Definition.Service {
	static setupService(
		log: LoggerInstance,
		app: Application<ServiceTypes, any>,
		store: Store,
		coreConnection: SofieCoreConnection | undefined
	): RundownFeathersService {
		app.use(Services.Rundown, new RundownService(log.category('RundownService'), app, store, coreConnection), {
			methods: Definition.ALL_METHODS,
			serviceEvents: Definition.ALL_EVENTS,
		})
		const service = app.service(Services.Rundown) as RundownFeathersService
		this.setupPublications(app, service)
		return service
	}
	private static setupPublications(app: Application<ServiceTypes, any>, service: RundownFeathersService) {
		service.publish('created', (data, _context) => {
			return app.channel(PublishChannels.RundownsInPlaylist(data.playlistId))
		})
		service.publish('updated', (rundown, _context) => {
			return app.channel(PublishChannels.RundownsInPlaylist(rundown.playlistId))
		})
		// service.publish('patched', (data, _context) => {
		// 	return app.channel(PublishChannels.RundownsInPlaylist(data.playlistId))
		// })
		service.publish('removed', (data, _context) => {
			return app.channel(PublishChannels.RundownsInPlaylist(data.playlistId))
		})
	}

	private observers: Lambda[] = []
	constructor(
		private log: LoggerInstance,
		private app: Application<ServiceTypes, any>,
		private store: Store,
		private coreConnection: SofieCoreConnection | undefined
	) {
		super()

		this.observers.push(
			observe(this.store.rundowns.rundowns, (change) => {
				this.log.debug('observed change', change)

				if (change.type === 'add') {
					this.emit('created', change.newValue)
				} else if (change.type === 'update') {
					// const patch = diff(change.oldValue, change.newValue)
					// if (patch) this.emit('patched', patch)
					this.emit('updated', change.newValue)
				} else if (change.type === 'delete') {
					this.emit('removed', { _id: change.oldValue._id, playlistId: change.oldValue.playlistId })
				}
			})
		)
	}
	destroy() {
		// dispose of observers:
		for (const obs of this.observers) {
			obs()
		}
	}

	public async find(params?: Params & { paginate?: PaginationParams }): Promise<Data[]> {
		// console.log('FIND', _params)

		let rundowns = Array.from(this.store.rundowns.rundowns.values())
		if (params?.query?.playlistId) {
			const playlistId = params.query.playlistId
			rundowns = rundowns.filter((r) => r.playlistId === playlistId)
		}
		return rundowns
	}
	public async get(id: Id, _params?: Params): Promise<Data> {
		const data = this.store.rundowns.rundowns.get(id)
		if (!data) throw new NotFound(`Rundown "${id}" not found`)
		return data
	}
	/** @deprecated not supported */
	public async create(_data: Data, _params?: Params): Promise<Result> {
		throw new NotImplemented(`Not supported`)
	}
	/** @deprecated not supported */
	public async update(_id: NullId, _data: Data, _params?: Params): Promise<Result> {
		throw new NotImplemented(`Not supported`)
	}
	/** @deprecated not supported */
	// public async patch(_id: NullId, _data: PatchData, _params?: Params): Promise<Result> {
	// 	throw new NotImplemented(`Not supported`)
	// }
	/** @deprecated not supported */
	public async remove(_id: NullId, _params?: Params): Promise<Result> {
		throw new NotImplemented(`Not supported`)
	}

	public async subscribeToRundownsInPlaylist(playlistId: RundownPlaylistId, params: Params): Promise<void> {
		this.coreConnection?.subscribeToPlaylist(playlistId)

		if (!params.connection) throw new Error('No connection!')
		this.app.channel(PublishChannels.RundownsInPlaylist(playlistId)).join(params.connection)
	}
	public async unSubscribeFromRundownsInPlaylist(playlistId: RundownPlaylistId, params: Params): Promise<void> {
		this.coreConnection?.unsubscribeFromPlaylistIfNoOneIsListening(playlistId)

		if (!params.connection) throw new Error('No connection!')
		this.app.channel(PublishChannels.RundownsInPlaylist(playlistId)).leave(params.connection)
	}
}
type Result = Definition.Result
type Id = Definition.Id
type NullId = Definition.NullId
type Data = Definition.Data
