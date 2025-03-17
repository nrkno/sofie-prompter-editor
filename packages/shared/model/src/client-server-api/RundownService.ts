import {
	PaginationParams,
	Params,
	ServiceMethods,
	EventEmitter,
	assertConstIsValid,
	assertConstIncludesAllMethods,
} from './lib.js'
import { Part, Rundown, RundownPlaylistId, Segment } from '../model/index.js'
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
	'subscribeToRundownsInPlaylist',
	'unSubscribeFromRundownsInPlaylist',
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

	/** Subscribe to all info within a specific playlist */
	subscribeToRundownsInPlaylist(playlistId: RundownPlaylistId, params?: Params): Promise<SubscribeInitialData>

	unSubscribeFromRundownsInPlaylist(playlistId: RundownPlaylistId, params?: Params): Promise<void>
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
export type Data = Rundown
export type PatchData = Omit<Diff<Data>, 'playlistId'> & Pick<Data, 'playlistId'>
export type RemovedData = { _id: Id; playlistId: Data['playlistId'] }
export type Result = Pick<Data, '_id'>
export type Id = Data['_id']
export type NullId = Id | null

export interface SubscribeInitialData {
	rundowns: Rundown[]
	segments: Segment[]
	// parts: Part[] // initial Parts are not needed by the GUI
}

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
