import EventEmitter from 'eventemitter3'
import { Application, PaginationParams, Params } from '@feathersjs/feathers'
import {
	ServiceTypes,
	Services,
	PrompterSettingsServiceDefinition as Definition,
} from '@sofie-prompter-editor/shared-model'
export { PlaylistServiceDefinition } from '@sofie-prompter-editor/shared-model'
import { PublishChannels } from '../PublishChannels.js'
import { CustomFeathersService } from './lib.js'
import { Store } from '../../data-stores/Store.js'
import { Lambda, observe } from 'mobx'
import { LoggerInstance } from '../../lib/logger.js'
import { BadRequest, NotFound, NotImplemented } from '@feathersjs/errors'

export type PrompterSettingsFeathersService = CustomFeathersService<Definition.Service, Definition.Events>

/** The methods exposed by this class are exposed in the API */
export class PrompterSettingsService extends EventEmitter<Definition.Events> implements Definition.Service {
	static setupService(
		log: LoggerInstance,
		app: Application<ServiceTypes, any>,
		store: Store
	): PrompterSettingsFeathersService {
		app.use(
			Services.PrompterSettings,
			new PrompterSettingsService(log.category('PrompterSettingsService'), app, store),
			{
				methods: Definition.ALL_METHODS,
				serviceEvents: Definition.ALL_EVENTS,
			}
		)
		const service = app.service(Services.PrompterSettings) as PrompterSettingsFeathersService
		this.setupPublications(app, service)
		return service
	}
	private static setupPublications(app: Application<ServiceTypes, any>, service: PrompterSettingsFeathersService) {
		service.publish('created', (_data, _context) => {
			return app.channel(PublishChannels.Controller())
		})
		service.publish('updated', (_data, _context) => {
			return app.channel(PublishChannels.Controller())
		})
	}

	private observers: Lambda[] = []
	constructor(private log: LoggerInstance, private app: Application<ServiceTypes, any>, private store: Store) {
		super()

		this.observers.push(
			observe(this.store.prompterSettings.prompterSettings, (change) => {
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

	public async find(_params?: Params & { paginate?: PaginationParams }): Promise<Data[]> {
		return [this.store.prompterSettings.prompterSettings.get()]
	}
	public async get(id: Id, _params?: Params): Promise<Data> {
		const data = this.store.prompterSettings.prompterSettings.get()
		if (!data) throw new NotFound(`PrompterSettings "${id}" not found`)
		return data
	}
	public async create(_data: Data, _params?: Params): Promise<Result> {
		throw new NotImplemented(`TODO`)
	}
	public async update(id: NullId, data: Data, _params?: Params): Promise<Result> {
		if (id === null) throw new BadRequest(`id must not be null`)

		this.store.prompterSettings.update(data)
		return this.get('')
	}

	public async subscribeToController(_: unknown, params: Params): Promise<void> {
		if (!params.connection) throw new Error('No connection!')
		this.app.channel(PublishChannels.Controller()).join(params.connection)
	}
}
type Result = Definition.Result
type Id = Definition.Id
type NullId = Definition.NullId
type Data = Definition.Data
