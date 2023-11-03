import EventEmitter from 'node:events'
// eslint-disable-next-line node/no-unpublished-import
import type { PaginationParams, Params, ServiceMethods } from '@feathersjs/feathers'
import { RundownPlaylist, RundownPlaylistId } from '../model.js'

/** The methods exposed by this class are exposed in the API */
export interface Methods extends EventEmitter, ServiceMethods {
	find(params?: Params & { paginate?: PaginationParams }): Promise<Data>
	get(id: Id, params?: Params): Promise<Data>
	create(data: Data, params?: Params): Promise<Result>
	update(id: NullId, data: Data, params?: Params): Promise<Result>
	patch(id: NullId, data: PartialData, params?: Params): Promise<Result>
	remove(id: NullId, params?: Params): Promise<Result>
}
export type Result = Pick<RundownPlaylist, '_id'>
export type Id = RundownPlaylistId
export type NullId = Id | null
export type Data = RundownPlaylist
export type PartialData = Partial<Data>
