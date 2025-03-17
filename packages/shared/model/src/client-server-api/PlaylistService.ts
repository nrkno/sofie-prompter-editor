import {
	PaginationParams,
	Params,
	ServiceMethods,
	EventEmitter,
	assertConstIsValid,
	assertConstIncludesAllMethods,
} from './lib.js'
import { RundownPlaylist } from '../model/index.js'
import { Diff } from '../patch.js'

/** List of all method names */
export const ALL_METHODS = [
	'find',
	'get',
	'create',
	'update',
	// 'patch',
	'remove',
	//
	'subscribeToPlaylists',

	//
	'tmpPing',
] as const
/** The methods exposed by this class are exposed in the API */
interface Methods extends Omit<ServiceMethods, 'patch'> {
	find(params?: Params & { paginate?: PaginationParams }): Promise<Data[]>
	get(id: Id, params?: Params): Promise<Data>
	/** @deprecated not supported  */
	create(data: Data, params?: Params): Promise<Result>
	/** @deprecated not supported  */
	update(id: NullId, data: Data, params?: Params): Promise<Result>
	/** @deprecated not supported  */
	// patch(id: NullId, data: PatchData, params?: Params): Promise<Result>
	/** @deprecated not supported  */
	remove(id: NullId, params?: Params): Promise<Result>

	/** Subscribe to a list of all playlists */
	subscribeToPlaylists(_?: unknown, params?: Params): Promise<Data[]>

	//
	tmpPing(payload: string): Promise<string>
}
export interface Service extends Methods, EventEmitter<Events> {}

/** List of all event names */
export const ALL_EVENTS = [
	'created',
	'updated',
	// 'patched',
	'removed',
	//
	'tmpPong',
] as const

/** Definitions of all events */
export interface Events {
	created: [data: Data]
	updated: [data: Data]
	// patched: [data: PatchData]
	removed: [id: Id]
	//
	tmpPong: [payload: string]
}

// Helper types for the default service methods:
export type Data = RundownPlaylist
export type PatchData = Diff<Data>
export type Result = Pick<Data, '_id'>
export type Id = Data['_id']
export type NullId = Id | null

// ============================================================================
// Type check: ensure that Methods and ALL_METHODS are in sync:
function typeCheckMethods(methods: keyof Omit<Methods, 'setup' | 'teardown'>) {
	// This does nothing, but is a type check:
	assertConstIsValid<Methods>(ALL_METHODS)
	assertConstIncludesAllMethods<typeof ALL_METHODS>(methods)
}
typeCheckMethods('' as any)

// Type check: ensure that Methods and ALL_METHODS are in sync:
function typeCheckEvents(events: keyof Events) {
	// This does nothing, but is a type check:
	assertConstIsValid<Events>(ALL_EVENTS)
	assertConstIncludesAllMethods<typeof ALL_EVENTS>(events)
}
typeCheckEvents('' as any)
