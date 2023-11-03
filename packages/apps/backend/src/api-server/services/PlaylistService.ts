import EventEmitter from 'node:events'
import { PaginationParams, Params } from '@feathersjs/feathers'
import { PlaylistServiceDefinition } from '@sofie-prompter-editor/shared-model'

export { PlaylistServiceDefinition }
/** The methods exposed by this class are exposed in the API */
export class PlaylistService extends EventEmitter implements PlaylistServiceDefinition.Methods {
	constructor() {
		// private _app: Application<ServiceTypes, any>
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
}
type Result = PlaylistServiceDefinition.Result
type Id = PlaylistServiceDefinition.Id
type NullId = PlaylistServiceDefinition.NullId
type Data = PlaylistServiceDefinition.Data
type PartialData = PlaylistServiceDefinition.PartialData
