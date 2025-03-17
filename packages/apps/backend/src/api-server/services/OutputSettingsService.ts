import EventEmitter from 'eventemitter3'
import { Application, PaginationParams, Params } from '@feathersjs/feathers'
import {
	ServiceTypes,
	Services,
	OutputSettingsServiceDefinition as Definition,
} from '@sofie-prompter-editor/shared-model'
export { PlaylistServiceDefinition } from '@sofie-prompter-editor/shared-model'
import { PublishChannels } from '../PublishChannels.js'
import { CustomFeathersService } from './lib.js'
import { Store } from '../../data-stores/Store.js'
import { Lambda, observe } from 'mobx'
import { LoggerInstance } from '../../lib/logger.js'
import { BadRequest, NotFound, NotImplemented } from '@feathersjs/errors'

export type OutputSettingsFeathersService = CustomFeathersService<Definition.Service, Definition.Events>

/** The methods exposed by this class are exposed in the API */
export class OutputSettingsService extends EventEmitter<Definition.Events> implements Definition.Service {
	static setupService(
		log: LoggerInstance,
		app: Application<ServiceTypes, any>,
		store: Store
	): OutputSettingsFeathersService {
		app.use(Services.OutputSettings, new OutputSettingsService(log.category('OutputSettingsService'), app, store), {
			methods: Definition.ALL_METHODS,
			serviceEvents: Definition.ALL_EVENTS,
		})
		const service = app.service(Services.OutputSettings) as OutputSettingsFeathersService
		this.setupPublications(app, service)
		return service
	}
	private static setupPublications(app: Application<ServiceTypes, any>, service: OutputSettingsFeathersService) {
		// service.publish('created', (_data, _context) => {
		// 	return app.channel(PublishChannels.OutputSettings())
		// })
		service.publish('updated', (_data, _context) => {
			return app.channel(PublishChannels.OutputSettings())
		})
	}

	private observers: Lambda[] = []
	constructor(private log: LoggerInstance, private app: Application<ServiceTypes, any>, private store: Store) {
		super()

		this.observers.push(
			observe(this.store.outputSettings.outputSettings, (change) => {
				this.log.debug('observed change', change)

				if (change.type === 'update') {
					this.emit('updated', change.newValue)
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

	// public async find(_params?: Params & { paginate?: PaginationParams }): Promise<Data[]> {
	// 	return [this.store.outputSettings.outputSettings.get()]
	// }
	public async get(id: null, _params?: Params): Promise<Data> {
		const data = this.store.outputSettings.outputSettings.get()
		if (!data) throw new NotFound(`OutputSettings "${id}" not found`)
		return data
	}
	// public async create(_data: Data, _params?: Params): Promise<Result> {
	// 	throw new NotImplemented(`TODO`)
	// }
	public async update(_id: null, data: Data, _params?: Params): Promise<Result> {
		this.store.outputSettings.update(data)
		return this.get(null)
	}
	public async patch(_id: null, partialData: Partial<Data>, _params?: Params): Promise<Result> {
		this.store.outputSettings.patch(partialData)
		return this.get(null)
	}

	public async subscribe(_: unknown, params: Params): Promise<Data> {
		if (!params.connection) throw new Error('No connection!')
		this.app.channel(PublishChannels.OutputSettings()).join(params.connection)
		return this.get(null)
	}
}
type Result = Definition.Result
// type Id = Definition.Id
// type NullId = Definition.NullId
type Data = Definition.Data
