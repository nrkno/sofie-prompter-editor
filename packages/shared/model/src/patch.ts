import { DataObject } from './model.js'

/*
 * This is a quick and dirty deep diff implementation
 */

export type Diff<T extends DataObject> = {
	_id: T['_id']
	/** This is just an internal type, not actually present runtime */
	__internalType: T
}

/** Patch some data, using a diff */
export function patch<T extends DataObject>(original: T, diff: Diff<T>) {
	const data: any = JSON.parse(JSON.stringify(original)) // clone

	for (const key of Object.keys(diff)) {
		const value = (diff as any)[key]
		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			data[key] = value
		} else if (value._$$ === 'array') {
			if (!Array.isArray(data[key])) data[key] = []
			data[key] = patch(data[key], value.values)
		} else if (value._$$ === 'undefined') {
			delete data[key]
		} else {
			if (Array.isArray(data[key])) data[key] = {}

			data[key] = patch(data[key], value)
		}
	}
	return data
}

/** Create a diff between two data objects */
export function diff<T extends DataObject>(a: T, b: T): Diff<T> | undefined {
	if (a._id !== b._id) throw new Error(`Cannot diff objects with different _id: "${a._id}" and "${b._id}"`)

	const d: Diff<T> | typeof NO_CHANGE = diffObject(a, b) as any
	if (d === NO_CHANGE) return undefined
	else {
		d._id = a._id
		return d
	}
}
function diffObject<T extends { [key: string]: any }>(a: T, b: T): any {
	let keys = new Set([...Object.keys(a), ...Object.keys(b)])

	let changed = false
	const diff: any = {}
	for (const key of keys.values()) {
		const change = diffValue(a[key], b[key])
		if (change !== NO_CHANGE) {
			changed = true
			diff[key] = change
		}
	}

	if (!changed) return NO_CHANGE
	return diff
}
function diffArray(a: any[], b: any[]) {
	const diff = {
		_$$: 'array',
		values: {} as any,
	}

	let changed = false
	const length = Math.max(a.length, b.length)
	for (let i = 0; i < length; i++) {
		const change = diffValue(a[i], b[i])
		if (change !== NO_CHANGE) {
			changed = true
			diff.values[i] = change
		}
	}

	if (!changed) return NO_CHANGE
	return diff
}
function diffValue(aValue: any, bValue: any) {
	if (aValue !== bValue) {
		if (bValue === undefined) {
			return { _$$: 'undefined' }
		} else if (typeof bValue !== 'object' || bValue === null) {
			return bValue
		} else {
			if (bValue.length && Array.isArray(bValue)) {
				// Is an array
				if (!Array.isArray(aValue)) return bValue
				else {
					return diffArray(aValue, bValue)
				}
			} else {
				if (Array.isArray(aValue)) return bValue
				else return diffObject(aValue, bValue)
			}
		}
	} else {
		return NO_CHANGE
	}
}
const NO_CHANGE = Symbol('NO_CHANGE')
