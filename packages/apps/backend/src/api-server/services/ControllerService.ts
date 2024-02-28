import EventEmitter from 'eventemitter3'
import { Application, PaginationParams, Params } from '@feathersjs/feathers'
import { ServiceTypes, Services, ControllerServiceDefinition as Definition } from '@sofie-prompter-editor/shared-model'
export { PlaylistServiceDefinition } from '@sofie-prompter-editor/shared-model'
import { PublishChannels } from '../PublishChannels.js'
import { CustomFeathersService } from './lib.js'
import { Store } from '../../data-stores/Store.js'
import { Lambda, observe } from 'mobx'
import { LoggerInstance } from '../../lib/logger.js'
import isEqual from 'lodash.isequal'

export type ControllerFeathersService = CustomFeathersService<Definition.Service, Definition.Events>

/** The methods exposed by this class are exposed in the API */
export class ControllerService extends EventEmitter<Definition.Events> implements Definition.Service {
	static setupService(
		log: LoggerInstance,
		app: Application<ServiceTypes, any>,
		store: Store
	): ControllerFeathersService {
		app.use(Services.Controller, new ControllerService(log.category('ControllerService'), app, store), {
			methods: Definition.ALL_METHODS,
			serviceEvents: Definition.ALL_EVENTS,
		})
		const service = app.service(Services.Controller) as ControllerFeathersService
		this.setupPublications(app, service)
		return service
	}
	private static setupPublications(app: Application<ServiceTypes, any>, service: ControllerFeathersService) {
		service.publish('message', (_data, _context) => {
			return app.channel(PublishChannels.ControllerMessages())
		})
	}

	private observers: Lambda[] = []
	constructor(private log: LoggerInstance, private app: Application<ServiceTypes, any>, private store: Store) {
		super()

		this.observers.push(
			observe(this.store.controller.message, (change) => {
				this.log.debug('observed change', change)

				if (change.type === 'add') {
					this.emit('message', change.newValue)
				} else if (change.type === 'update') {
					this.emit('message', change.newValue)
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
	private _hackyDebouncer: {
		timestamp: number
		message: Data | null
	} = {
		timestamp: 0,
		message: null,
	}
	public async sendMessage(message: Data, _params?: Params): Promise<void> {
		const timeSinceLast = Date.now() - this._hackyDebouncer.timestamp

		if (timeSinceLast < 100 && isEqual(this._hackyDebouncer.message, message)) {
			// The same message was sent twice in rapid succession, ignore
			return
		}
		this._hackyDebouncer = {
			timestamp: Date.now(),
			message,
		}

		this.store.controller.updateMessage(message)
	}

	public async subscribeToMessages(_: unknown, params: Params): Promise<void> {
		if (!params.connection) throw new Error('No connection!')
		this.app.channel(PublishChannels.ControllerMessages()).join(params.connection)
	}
}
type Result = Definition.Result
// type Id = Definition.Id
// type NullId = Definition.NullId
type Data = Definition.Data
