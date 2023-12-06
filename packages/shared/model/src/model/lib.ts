import { z } from 'zod'
import { AnyProtectedString } from '../ProtectedString.js'

export interface DataObject {
	_id: AnyProtectedString
}
/**
 * Convenience function, defines a zod string but infers a ProtectedString
 * Usage: ZodProtectedString<MyProtectedStringType>()
 */
export function ZodProtectedString<T extends AnyProtectedString>(): Omit<
	z.ZodString,
	'_type' | '_output' | '_input'
> & {
	_type: T
	_output: T
	_input: T
} {
	return z.string() as any
}
