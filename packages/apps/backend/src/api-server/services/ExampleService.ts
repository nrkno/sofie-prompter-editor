import EventEmitter from 'eventemitter3'
import { Application, PaginationParams, Params } from '@feathersjs/feathers'
import { ServiceTypes, Services, ExampleServiceDefinition as Definition } from '@sofie-prompter-editor/shared-model'
export { ExampleServiceDefinition } from '@sofie-prompter-editor/shared-model'
import { PublishChannels } from '../PublishChannels.js'
import { CustomFeathersService } from './lib.js'

export type ExampleFeathersService = CustomFeathersService<Definition.Service, Definition.Events>

/** The methods exposed by this class are exposed in the API */
export class ExampleService extends EventEmitter<Definition.Events> implements Definition.Service {
	static setupService(app: Application<ServiceTypes, any>): ExampleFeathersService {
		app.use(Services.Example, new ExampleService(app), {
			methods: Definition.ALL_METHODS,
			serviceEvents: Definition.ALL_EVENTS,
		})
		const service: ExampleFeathersService = app.service(Services.Example)
		this.setupPublications(app, service)
		return service
	}
	private static setupPublications(app: Application<ServiceTypes, any>, service: ExampleFeathersService) {
		// Publish pongGeneric to Everyone channel:
		service.publish('pongGeneric', (_data, _context) => {
			console.log('publishing pongGeneric')

			return app.channel(PublishChannels.Everyone())
		})
		service.publish('pongCategory', (data, _context) => {
			console.log(`publishing pongCategory ${data.category}`)

			return app.channel(PublishChannels.ExampleCategory(data.category))
		})
	}
	constructor(private app: Application<ServiceTypes, any>) {
		super()
	}

	public async find(_params?: Params & { paginate?: PaginationParams }): Promise<Data> {
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

	public async pingGeneric(_payload: string): Promise<string> {
		console.log('got a pingGeneric!')
		setTimeout(() => {
			console.log('sending a pong!')
			this.emit('pongGeneric', `This generic pong was sent later!`)
		}, 1000)

		return `Ok, I'll ping you back in a while!`
	}
	public async subscribeToPongCategory(category: string, params: Params): Promise<void> {
		// Add client to the channel:
		if (!params.connection) throw new Error('No connection!')

		console.log(`Subscribing to category "${category}"`)

		this.app.channel(PublishChannels.ExampleCategory(category)).join(params.connection)
	}
	public async unsubscribeToPongCategory(category: string, params: Params): Promise<void> {
		// Add client to the channel:
		if (!params.connection) throw new Error('No connection!')

		console.log(`Unsubscribing  from category "${category}"`)

		this.app.channel(PublishChannels.ExampleCategory(category)).leave(params.connection)
	}
	public async pingCategory(category: string, _payload: string): Promise<string> {
		console.log(`got a pingCategory "${category}"!`)
		setTimeout(() => {
			console.log('sending a pong!')
			this.emit('pongCategory', { category, payload: `This generic pong was sent later!` })
		}, 1000)

		return `Ok, I'll ping "${category}" in a while!`
	}
}
type Result = Definition.Result
type Id = Definition.Id
type NullId = Definition.NullId
type Data = Definition.Data
type PartialData = Definition.PartialData
