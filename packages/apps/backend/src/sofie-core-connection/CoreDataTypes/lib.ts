import fastClone from 'fast-clone'
import { ReadonlyDeep } from 'type-fest'

export function assertNever(_never: never): void {
	// Do nothing. This is a type guard
}
export function clone<T>(o: ReadonlyDeep<T> | Readonly<T> | T): T {
	// Use this instead of fast-clone directly, as this retains the type
	return fastClone(o as any)
}
