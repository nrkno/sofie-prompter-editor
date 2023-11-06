// eslint-disable-next-line node/no-unpublished-import
import type EventEmitter from 'eventemitter3'
// eslint-disable-next-line node/no-unpublished-import
import type { PaginationParams, Params, ServiceMethods } from '@feathersjs/feathers'

export { EventEmitter, PaginationParams, Params, ServiceMethods }

export type TupleToUnion<T extends readonly any[]> = T[number]
export function assertConstIsValid<Methods>(_m: readonly (keyof Methods)[]): void {
	// do nothing, is a type check
}
export function assertConstIncludesAllMethods<MethodConst extends readonly string[]>(
	_m: TupleToUnion<MethodConst>
): void {
	// do nothing, is a type check
}
