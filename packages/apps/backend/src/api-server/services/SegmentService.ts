import EventEmitter from 'eventemitter3'
import { Application, PaginationParams, Params } from '@feathersjs/feathers'
import { ServiceTypes, Services, SegmentServiceDefinition as Definition } from '@sofie-prompter-editor/shared-model'
import { PublishChannels } from '../PublishChannels.js'
import { CustomFeathersService } from './lib.js'
import { Store } from '../../data-stores/Store.js'
import { Lambda, observe } from 'mobx'
import { LoggerInstance } from '../../lib/logger.js'
import { NotFound, NotImplemented } from '@feathersjs/errors'

export type SegmentFeathersService = CustomFeathersService<Definition.Service, Definition.Events>

/** The methods exposed by this class are exposed in the API */
export class SegmentService extends EventEmitter<Definition.Events> implements Definition.Service {
	static setupService(log: LoggerInstance, app: Application<ServiceTypes, any>, store: Store): SegmentFeathersService {
		app.use(Services.Segment, new SegmentService(log.category('SegmentService'), store), {
			methods: Definition.ALL_METHODS,
			serviceEvents: Definition.ALL_EVENTS,
		})
		const service = app.service(Services.Segment) as SegmentFeathersService
		this.setupPublications(app, service)
		return service
	}
	private static setupPublications(app: Application<ServiceTypes, any>, service: SegmentFeathersService) {
		service.publish('created', (data, _context) => {
			return app.channel(PublishChannels.RundownsInPlaylist(data.playlistId))
		})
		service.publish('updated', (data, _context) => {
			return app.channel(PublishChannels.RundownsInPlaylist(data.playlistId))
		})
		// service.publish('patched', (data, _context) => {
		// 	return app.channel(PublishChannels.RundownsInPlaylist(data.playlistId))
		// })
		service.publish('removed', (data, _context) => {
			return app.channel(PublishChannels.RundownsInPlaylist(data.playlistId))
		})
	}

	private observers: Lambda[] = []
	constructor(private log: LoggerInstance, private store: Store) {
		super()

		this.observers.push(
			observe(this.store.segments.segments, (change) => {
				this.log.debug('observed change', change)

				if (change.type === 'add') {
					this.emit('created', change.newValue)
				} else if (change.type === 'update') {
					// const patch = diff(change.oldValue, change.newValue)
					// if (patch) this.emit('patched', patch)
					this.emit('updated', change.newValue)
				} else if (change.type === 'delete') {
					this.emit('removed', {
						_id: change.oldValue._id,
						playlistId: change.oldValue.playlistId,
						rundownId: change.oldValue.rundownId,
					})
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
		return Array.from(this.store.segments.segments.values())
	}
	public async get(id: Id, _params?: Params): Promise<Data> {
		const data = this.store.segments.segments.get(id)
		if (!data) throw new NotFound(`Segment "${id}" not found`)
		return data
	}
	/** @deprecated not supported */
	public async create(_data: Data, _params?: Params): Promise<Result> {
		throw new NotImplemented(`Not supported`)
	}
	/** @deprecated not supported */
	public async update(_id: NullId, _data: Data, _params?: Params): Promise<Result> {
		throw new NotImplemented(`Not supported`)
	}
	/** @deprecated not supported */
	// public async patch(_id: NullId, _data: PatchData, _params?: Params): Promise<Result> {
	// 	throw new NotImplemented(`Not supported`)
	// }
	/** @deprecated not supported */
	public async remove(_id: NullId, _params?: Params): Promise<Result> {
		throw new NotImplemented(`Not supported`)
	}
}
type Result = Definition.Result
type Id = Definition.Id
type NullId = Definition.NullId
type Data = Definition.Data
