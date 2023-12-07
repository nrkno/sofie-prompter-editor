import EventEmitter from 'eventemitter3'
import { Application, PaginationParams, Params } from '@feathersjs/feathers'
import { ServiceTypes, Services, ViewPortServiceDefinition as Definition } from '@sofie-prompter-editor/shared-model'
import { PublishChannels } from '../PublishChannels.js'
import { CustomFeathersService } from './lib.js'
import { Store } from '../../data-stores/Store.js'
import { Lambda, observe } from 'mobx'
import { LoggerInstance } from '../../lib/logger.js'
import { BadRequest, NotFound } from '@feathersjs/errors'
import { assertNever } from '@sofie-prompter-editor/shared-lib'

export type ViewPortFeathersService = CustomFeathersService<Definition.Service, Definition.Events>

/** The methods exposed by this class are exposed in the API */
export class ViewPortService extends EventEmitter<Definition.Events> implements Definition.Service {
	static setupService(log: LoggerInstance, app: Application<ServiceTypes, any>, store: Store): ViewPortFeathersService {
		app.use(Services.ViewPort, new ViewPortService(log.category('ViewPortService'), app, store), {
			methods: Definition.ALL_METHODS,
			serviceEvents: Definition.ALL_EVENTS,
		})
		const service = app.service(Services.ViewPort) as ViewPortFeathersService
		this.setupPublications(app, service)
		return service
	}
	private static setupPublications(app: Application<ServiceTypes, any>, service: ViewPortFeathersService) {
		service.publish('created', (_data, _context) => {
			return app.channel(PublishChannels.ViewPort())
		})
		service.publish('updated', (_data, _context) => {
			return app.channel(PublishChannels.ViewPort())
		})
		service.publish('removed', (_data, _context) => {
			return app.channel(PublishChannels.ViewPort())
		})
	}

	private observers: Lambda[] = []
	constructor(private log: LoggerInstance, private app: Application<ServiceTypes, any>, private store: Store) {
		super()

		this.observers.push(
			observe(this.store.viewPort.viewPort, (change) => {
				this.log.debug('observed change', change)
				if (change.type === 'add') {
					this.emit('created', change.object)
				} else if (change.type === 'update') {
					this.emit('updated', change.object)
				} else if (change.type === 'remove') {
					this.emit('updated', change.object)
				} else assertNever(change)
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
		return [this.store.viewPort.viewPort]
	}
	public async get(id: Id, _params?: Params): Promise<Data> {
		const data = this.store.viewPort.viewPort
		if (!data) throw new NotFound(`ViewPort "${id}" not found`)
		return data
	}
	public async update(id: NullId, data: Data, _params?: Params): Promise<Result> {
		if (id === null) throw new BadRequest(`id must not be null`)
		if (id !== data._id) throw new BadRequest(`Cannot change id of ViewPort`)

		this.store.viewPort.update(data)
		return this.get(data._id)
	}

	public async registerInstance(instanceId: string, _params?: Params): Promise<boolean> {
		return this.store.viewPort.registerInstance(instanceId)
	}

	public async subscribeToViewPort(_: unknown, params: Params): Promise<void> {
		if (!params.connection) throw new Error('No connection!')
		this.app.channel(PublishChannels.ViewPort()).join(params.connection)
	}
}

type Result = Definition.Result
type Id = Definition.Id
type NullId = Definition.NullId
type Data = Definition.Data
