import { Params, ServiceMethods, EventEmitter, assertConstIsValid, assertConstIncludesAllMethods } from './lib.js'
import { SystemStatus } from '../model/index.js'

/** List of all method names */
export const ALL_METHODS = [
	// 'find',
	'get',
	// 'create',
	// 'update',
	// 'patch',
	// 'remove',
	//
	'subscribe',
] as const
/** The methods exposed by this class are exposed in the API */
interface Methods extends Omit<ServiceMethods, 'get' | 'find' | 'update' | 'patch' | 'remove' | 'create'> {
	// find(params?: Params & { paginate?: PaginationParams }): Promise<Data[]>
	get(id: null, params?: Params): Promise<Data>
	// create(data: Data, params?: Params): Promise<Result>
	// update(id: NullId, data: Data, params?: Params): Promise<Result>

	/** Subscribe to Controller data */
	subscribe(_?: unknown, params?: Params): Promise<void>
}
export interface Service extends Methods, EventEmitter<Events> {}

/** List of all event names */
export const ALL_EVENTS = [
	// 'created',
	'updated',
	// 'patched',
	// 'removed',
	//
] as const

/** Definitions of all events */
export interface Events {
	// created: [data: Data]
	updated: [data: Data]
	// patched: [data: PatchData]
	// removed: [data: RemovedData]
	//
}

// Helper types for the default service methods:
export type Data = SystemStatus
// export type PatchData = Diff<Data>
// export type RemovedData = { _id: Id; playlistId: Data['playlistId']; rundownId: Data['rundownId'] }
export type Result = Data
export type Id = ''
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
