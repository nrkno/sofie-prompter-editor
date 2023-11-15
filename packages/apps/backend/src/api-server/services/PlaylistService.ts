import EventEmitter from 'eventemitter3'
import { Application, PaginationParams, Params } from '@feathersjs/feathers'
import { ServiceTypes, Services, PlaylistServiceDefinition as Definition } from '@sofie-prompter-editor/shared-model'
export { PlaylistServiceDefinition } from '@sofie-prompter-editor/shared-model'
import { PublishChannels } from '../PublishChannels.js'
import { CustomFeathersService } from './lib.js'
import { Store } from '../../data-stores/Store.js'
import { Lambda, observe } from 'mobx'
import { LoggerInstance } from '../../lib/logger.js'

export type PlaylistFeathersService = CustomFeathersService<Definition.Service, Definition.Events>

/** The methods exposed by this class are exposed in the API */
export class PlaylistService extends EventEmitter<Definition.Events> implements Definition.Service {
	static setupService(app: Application<ServiceTypes, any>, store: Store, log: LoggerInstance): PlaylistFeathersService {
		app.use(Services.Playlist, new PlaylistService(app, store, log.category('PlaylistService')), {
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
			return app.channel(PublishChannels.Everyone())
		})

		service.publish('created', (_data, _context) => {
			return app.channel(PublishChannels.AllPlaylists())
		})
		service.publish('updated', (_data, _context) => {
			return app.channel(PublishChannels.AllPlaylists())
		})
		service.publish('removed', (_data, _context) => {
			return app.channel(PublishChannels.AllPlaylists())
		})
	}

	private observers: Lambda[] = []
	constructor(private app: Application<ServiceTypes, any>, private store: Store, private log: LoggerInstance) {
		super()

		this.observers.push(
			observe(this.store.playlists.playlists, (change) => {
				this.log.info('observed change', change)
				if (change.type === 'add') {
					this.emit('created', change.newValue)
				} else if (change.type === 'update') {
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
	public async get(_id: Id, _params?: Params): Promise<Data> {
		throw new Error('Not implemented')
	}
	public async create(_data: Data, _params?: Params): Promise<Result> {
		throw new Error('Not implemented')
	}
	public async update(_id: NullId, _data: Data, _params?: Params): Promise<Result> {
		throw new Error('Not implemented')
	}
	public async patch(_id: NullId, _data: PartialData, _params?: Params): Promise<Result> {
		throw new Error('Not implemented')
	}
	public async remove(_id: NullId, _params?: Params): Promise<Result> {
		throw new Error('Not implemented')
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
type PartialData = Definition.PartialData
