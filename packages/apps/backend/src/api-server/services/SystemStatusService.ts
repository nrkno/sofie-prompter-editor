import EventEmitter from 'eventemitter3'
import { Application, PaginationParams, Params } from '@feathersjs/feathers'
import {
	ServiceTypes,
	Services,
	SystemStatusServiceDefinition as Definition,
} from '@sofie-prompter-editor/shared-model'
export { PlaylistServiceDefinition } from '@sofie-prompter-editor/shared-model'
import { PublishChannels } from '../PublishChannels.js'
import { CustomFeathersService } from './lib.js'
import { Store } from '../../data-stores/Store.js'
import { Lambda, observe } from 'mobx'
import { LoggerInstance } from '../../lib/logger.js'
import { BadRequest, NotFound, NotImplemented } from '@feathersjs/errors'

export type SystemStatusFeathersService = CustomFeathersService<Definition.Service, Definition.Events>

/** The methods exposed by this class are exposed in the API */
export class SystemStatusService extends EventEmitter<Definition.Events> implements Definition.Service {
	static setupService(
		log: LoggerInstance,
		app: Application<ServiceTypes, any>,
		store: Store
	): SystemStatusFeathersService {
		app.use(Services.SystemStatus, new SystemStatusService(log.category('SystemStatusService'), app, store), {
			methods: Definition.ALL_METHODS,
			serviceEvents: Definition.ALL_EVENTS,
		})
		const service = app.service(Services.SystemStatus) as SystemStatusFeathersService
		this.setupPublications(app, service)
		return service
	}
	private static setupPublications(app: Application<ServiceTypes, any>, service: SystemStatusFeathersService) {
		service.publish('updated', (_data, _context) => {
			return app.channel(PublishChannels.SystemStatus())
		})
	}

	private observers: Lambda[] = []
	constructor(private log: LoggerInstance, private app: Application<ServiceTypes, any>, private store: Store) {
		super()

		this.observers.push(
			observe(this.store.systemStatus.systemStatus, (change) => {
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

	public async get(_id: Id, _params?: Params): Promise<Data> {
		const data = this.store.systemStatus.systemStatus.get()
		if (!data) throw new NotFound(`SystemStatus not found`)
		return data
	}

	public async subscribe(_: unknown, params: Params): Promise<void> {
		if (!params.connection) throw new Error('No connection!')
		this.app.channel(PublishChannels.SystemStatus()).join(params.connection)
	}
}
// type Result = Definition.Result
type Id = Definition.Id
// type NullId = Definition.NullId
type Data = Definition.Data
