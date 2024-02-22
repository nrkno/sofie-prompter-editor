import EventEmitter from 'eventemitter3'
import { Application, PaginationParams, Params, Query } from '@feathersjs/feathers'
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
				if (change.type === 'update') {
					this.emit('updated', change.object.get())
				} else assertNever(change.type)
			})
		)
	}
	destroy() {
		// dispose of observers:
		for (const obs of this.observers) {
			obs()
		}
	}

	public async get(_id: null, _params?: Params): Promise<Data> {
		const data = this.store.viewPort.viewPort.get()
		return data
	}
	public async update(_id: null, data: Data, _params?: Params): Promise<Result> {
		this.store.viewPort.update(data)
		return this.get(null)
	}
	public async patch(_id: null, data: Partial<Data>, _params?: Params<Query> | undefined): Promise<Definition.Result> {
		this.store.viewPort.patch(data)
		return {
			_id: '',
		}
	}

	public async subscribeToViewPort(_: unknown, params: Params): Promise<Data> {
		if (!params.connection) throw new Error('No connection!')
		this.app.channel(PublishChannels.ViewPort()).join(params.connection)
		return this.get(null)
	}
}

type Result = Definition.Result
type Data = Definition.Data
