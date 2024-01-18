import { Params, EventEmitter, assertConstIsValid, assertConstIncludesAllMethods } from './lib.js'
import { ControllerMessage } from '../model/index.js'

/** List of all method names */
export const ALL_METHODS = [
	'sendMessage',
	//
	'subscribeToMessages',
] as const
/** The methods exposed by this class are exposed in the API */
interface Methods {
	/** Send Controller message */
	sendMessage(message: Data, params?: Params): Promise<void>

	/** Subscribe to Controller messages */
	subscribeToMessages(_?: unknown, params?: Params): Promise<void>
}
export interface Service extends Methods, EventEmitter<Events> {}

/** List of all event names */
export const ALL_EVENTS = ['message'] as const

/** Definitions of all events */
export interface Events {
	message: [data: Data]
}

// Helper types for the default service methods:
export type Data = ControllerMessage
export type Result = Data
// export type Id = ''
// export type NullId = Id | null

// ============================================================================
// Type check: ensure that Methods and ALL_METHODS are in sync:
function typeCheckMethods(methods: keyof Methods) {
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
