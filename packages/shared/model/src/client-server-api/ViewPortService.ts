import {
	PaginationParams,
	Params,
	ServiceMethods,
	EventEmitter,
	assertConstIsValid,
	assertConstIncludesAllMethods,
} from './lib.js'
import { ViewPort } from '../model/index.js'

/** List of all method names */
export const ALL_METHODS = [
	// 'find',
	'get',
	// 'create',
	'update',
	'patch',
	// 'remove',
	//
	'subscribeToViewPort',
] as const
/** The methods exposed by this class are exposed in the API */
interface Methods {
	// find(params?: Params & { paginate?: PaginationParams }): Promise<Data[]>
	get(id: null, params?: Params): Promise<Data>
	// create(data: Data, params?: Params): Promise<Result>
	update(id: null, data: Data, params?: Params): Promise<Result>
	patch(_id: null, _data: Partial<Data>, _params?: Params): Promise<Result>

	/** Subscribe to ViewPort data */
	subscribeToViewPort(_?: unknown, params?: Params): Promise<Data>
}
export interface Service extends Methods, EventEmitter<Events> {}

/** List of all event names */
export const ALL_EVENTS = [
	'created',
	'updated',
	// 'patched',
	'removed',
	//
] as const

/** Definitions of all events */
export interface Events {
	created: [data: Data]
	updated: [data: Data]
	// patched: [data: PatchData]
	removed: [data: RemovedData]
	//
}

// Helper types for the default service methods:
export type Data = ViewPort
// export type PatchData = Diff<Data>
export type RemovedData = { _id: Id }
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
