import {
	PaginationParams,
	Params,
	ServiceMethods,
	EventEmitter,
	assertConstIsValid,
	assertConstIncludesAllMethods,
} from './lib.js'
import { RundownPlaylist } from '../model.js'

/** List of all method names */
export const ALL_METHODS = [
	'find',
	'get',
	'create',
	'update',
	'patch',
	'remove',
	//
	'subscribeToPlaylists',
	//
	'tmpPing',
] as const
/** The methods exposed by this class are exposed in the API */
interface Methods extends ServiceMethods {
	find(params?: Params & { paginate?: PaginationParams }): Promise<Data[]>
	get(id: Id, params?: Params): Promise<Data>
	create(data: Data, params?: Params): Promise<Result>
	update(id: NullId, data: Data, params?: Params): Promise<Result>
	patch(id: NullId, data: PartialData, params?: Params): Promise<Result>
	remove(id: NullId, params?: Params): Promise<Result>
	//
	subscribeToPlaylists(_?: unknown, params?: Params): Promise<void>
	//
	tmpPing(payload: string): Promise<string>
}
export interface Service extends Methods, EventEmitter<Events> {}

/** List of all event names */
export const ALL_EVENTS = [
	'created',
	'updated',
	'patched',
	'removed',
	//
	'updated',
	'tmpPong',
] as const

/** Definitions of all events */
export interface Events {
	created: [data: Data]
	updated: [data: Data]
	patched: [data: PartialData]
	removed: [id: Id]
	//
	tmpPong: [payload: string]
}

// Helper types for the default service methods:
export type Data = RundownPlaylist
export type PartialData = Partial<Data>
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
