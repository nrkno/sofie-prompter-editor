import { action, makeObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { ViewPort, ViewPortSchema } from '@sofie-prompter-editor/shared-model'
import { getCurrentTime } from '../lib/getCurrentTime.js'

export class ViewPortStore {
	public viewPort = observable.box<ViewPort>({
		_id: '',

		// TODO: load these from persistent store upon startup?
		lastKnownState: {
			controllerMessage: {
				offset: {
					offset: 0,
					target: null,
				},
				speed: 0,
			},
			timestamp: getCurrentTime(),
		},
		// assume a 16/9 default screen
		aspectRatio: 1.77,
	})

	constructor() {
		makeObservable(this, {
			create: action,
			update: action,
		})
	}

	create(data: ViewPort) {
		this._updateIfChanged(data)
	}
	update(data: ViewPort) {
		this._updateIfChanged(data)
	}
	patch(partialData: Partial<ViewPort>) {
		const data = { ...this.viewPort.get(), ...partialData }
		this._updateIfChanged(data)
	}

	// private verifyData(viewPort: ViewPort) {

	// 	// for (const key of objectKeys(viewPort)) {
	// 	// 	if (key === '_id') ensureString(viewPort, key, viewPort[key], true)
	// 	// 	else if (key === 'instanceId') ensureString(viewPort, key, viewPort[key], true)
	// 	// 	else if (key === 'width') ensureNumber(viewPort, key, viewPort[key], true)
	// 	// 	else if (key === 'position') {
	// 	// 		const position = viewPort[key]
	// 	// 		for (const key of objectKeys(position)) {
	// 	// 			if (key === 'scrollOffset') ensureNumber(viewPort, key, position[key], true)
	// 	// 			else if (key === 'scrollOffsetTarget') ensureStringOrNull(viewPort, key, position[key], true)
	// 	// 			else assertNever(key)
	// 	// 		}
	// 	// 	} else assertNever(key)
	// 	// }

	// 	viewPort._id
	// }
	private _updateIfChanged(viewPort: ViewPort) {
		if (!isEqual(this.viewPort, viewPort)) {
			ViewPortSchema.parse(viewPort)
			this.viewPort.set(viewPort)
		}
	}
}
// function objectKeys<T extends object>(obj: T): (keyof T)[] {
// 	return Object.keys(obj) as (keyof T)[]
// }

// function ensureString(obj: any, key: string, value: string, strict?: boolean): string {
// 	if (typeof value === 'string') return value

// 	if (!strict) {
// 		if (typeof value === 'number') return String(value)
// 	}
// 	throw new Error(`${key}: expected string, got ${typeof value}`)
// }
// function ensureNumber(obj: any, key: string, value: number, strict?: boolean): number {
// 	if (typeof value === 'number') return value

// 	if (!strict) {
// 		if (typeof value === 'string') {
// 			const num = Number(value)
// 			if (isFinite(num)) return num
// 		}
// 	}
// 	throw new Error(`${key}: expected number, got ${typeof value}`)
// }
// function ensureStringOrNull(obj: any, key: string, value: string | null, strict?: boolean): string | null {
// 	if (value === null) return value

// 	return ensureString(obj, key, value, strict)
// }
