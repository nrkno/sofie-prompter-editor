import EventEmitter from 'eventemitter3'
import { Application, PaginationParams, Params } from '@feathersjs/feathers'
import { ServiceTypes, Services, PlaylistServiceDefinition as Definition } from '@sofie-prompter-editor/shared-model'
export { PlaylistServiceDefinition } from '@sofie-prompter-editor/shared-model'
import { PublishChannels } from '../PublishChannels.js'
import { CustomFeathersService } from './lib.js'
import { Store } from '../../data-stores/Store.js'
import { Lambda, observe } from 'mobx'
import { LoggerInstance } from '../../lib/logger.js'
import { NotImplemented, NotFound } from '@feathersjs/errors'

export type PlaylistFeathersService = CustomFeathersService<Definition.Service, Definition.Events>

/** The methods exposed by this class are exposed in the API */
export class PlaylistService extends EventEmitter<Definition.Events> implements Definition.Service {
	static setupService(log: LoggerInstance, app: Application<ServiceTypes, any>, store: Store): PlaylistFeathersService {
		app.use(Services.Playlist, new PlaylistService(log.category('PlaylistService'), app, store), {
			methods: Definition.ALL_METHODS,
			serviceEvents: Definition.ALL_EVENTS,
		})
		const service = app.service(Services.Playlist) as PlaylistFeathersService
		this.setupPublications(app, service)
		return service
	}
	private static setupPublications(app: Application<ServiceTypes, any>, service: PlaylistFeathersService) {
		// Publish tmpPong to Everyone channel:
		service.publish('tmpPong', (_data, _context) => {
			// todo: remove
			return app.channel(PublishChannels.Everyone())
		})

		service.publish('created', (_data, _context) => {
			return app.channel(PublishChannels.AllPlaylists())
		})
		service.publish('updated', (_data, _context) => {
			return app.channel(PublishChannels.AllPlaylists())
		})
		// service.publish('patched', (_data, _context) => {
		// 	return app.channel(PublishChannels.AllPlaylists())
		// })
		service.publish('removed', (_data, _context) => {
			return app.channel(PublishChannels.AllPlaylists())
		})
	}

	private observers: Lambda[] = []
	constructor(private log: LoggerInstance, private app: Application<ServiceTypes, any>, private store: Store) {
		super()

		this.observers.push(
			observe(this.store.playlists.playlists, (change) => {
				this.log.debug('observed change', change)

				if (change.type === 'add') {
					this.emit('created', change.newValue)
				} else if (change.type === 'update') {
					// const patch = diff(change.oldValue, change.newValue)
					// if (patch) this.emit('patched', patch)
					this.emit('updated', change.newValue)
				} else if (change.type === 'delete') {
					this.emit('removed', change.oldValue._id)
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

	public async find(_params?: Params & { paginate?: PaginationParams }): Promise<Data[]> {
		return Array.from(this.store.playlists.playlists.values())
	}
	public async get(id: Id, _params?: Params): Promise<Data> {
		const data = this.store.playlists.playlists.get(id)
		if (!data) throw new NotFound(`Playlist "${id}" not found`)
		return data
	}
	/** @deprecated not supported */
	public async create(_data: Data, _params?: Params): Promise<Result> {
		throw new NotImplemented(`Not supported`)
		// this.store.playlists.create(data)
		// return this.get(data._id)
	}
	/** @deprecated not supported */
	public async update(_id: NullId, _data: Data, _params?: Params): Promise<Result> {
		throw new NotImplemented(`Not supported`)
		// if (id === null) throw new BadRequest(`id must not be null`)
		// if (id !== data._id) throw new BadRequest(`Cannot change id of playlist`)

		// this.store.playlists.update(data)
		// return this.get(data._id)
	}
	/** @deprecated not supported */
	// public async patch(_id: NullId, _data: PatchData, _params?: Params): Promise<Result> {
	// 	throw new NotImplemented(`Not supported`)
	// 	// if (id === null) throw new BadRequest(`id must not be null`)
	// 	// const existing = await this.get(id)
	// 	// const newData: RundownPlaylist = {
	// 	// 	...existing,
	// 	// 	...data,
	// 	// }
	// 	// this.store.playlists.update(newData)
	// 	// return newData
	// }
	/** @deprecated not supported */
	public async remove(_id: NullId, _params?: Params): Promise<Result> {
		throw new NotImplemented(`Not supported`)
		// if (id === null) throw new BadRequest(`id must not be null`)
		// const existing = await this.get(id)
		// this.store.playlists.remove(id)
		// return existing
	}
	// public async setup?(app: Application, path: string): Promise<void> {
	// 	throw new Error('Not implemented')
	// }
	// public async teardown?(app: Application, path: string): Promise<void> {
	// 	throw new Error('Not implemented')
	// }

	public async subscribeToPlaylists(_: unknown, params: Params): Promise<void> {
		if (!params.connection) throw new Error('No connection!')

		this.app.channel(PublishChannels.AllPlaylists()).join(params.connection)
	}

	public async tmpPing(_payload: string): Promise<string> {
		console.log('got a ping!')
		setTimeout(() => {
			console.log('sending a pong!')
			this.emit('tmpPong', `This pong was sent later!`)
		}, 1000)

		return `Ok, I'll ping you back in a while!`
	}
}
type Result = Definition.Result
type Id = Definition.Id
type NullId = Definition.NullId
type Data = Definition.Data
