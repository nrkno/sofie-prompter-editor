import EventEmitter from 'eventemitter3'
import { Application, PaginationParams, Params } from '@feathersjs/feathers'
import { ServiceTypes, Services, PlaylistServiceDefinition as Definition } from '@sofie-prompter-editor/shared-model'
export { PlaylistServiceDefinition } from '@sofie-prompter-editor/shared-model'
import { PublishChannels } from '../PublishChannels.js'
import { CustomFeathersService } from './lib.js'

export type PlaylistFeathersService = CustomFeathersService<Definition.Service, Definition.Events>

/** The methods exposed by this class are exposed in the API */
export class PlaylistService extends EventEmitter<Definition.Events> implements Definition.Service {
	static setupService(app: Application<ServiceTypes, any>): PlaylistFeathersService {
		app.use(Services.Playlist, new PlaylistService(), {
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
	}
	constructor() {
		super()
	}

	public async find(_params?: Params & { paginate?: PaginationParams }): Promise<Data[]> {
		throw new Error('Not implemented')
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
