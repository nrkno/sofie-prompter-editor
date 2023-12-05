import { action, makeAutoObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { Part, PartId } from 'packages/shared/model/dist'

export class PartStore {
	ready: boolean = false
	public readonly parts = observable.map<PartId, Part>()

	constructor() {
		makeAutoObservable(this, {
			create: action,
			update: action,
			remove: action,
		})
	}

	create(part: Part) {
		this._updateIfChanged(part)
	}
	update(part: Part) {
		this._updateIfChanged(part)
	}
	remove(partId: PartId) {
		this._deleteIfChanged(partId)
	}

	private _updateIfChanged(part: Part) {
		if (!isEqual(this.parts.get(part._id), part)) {
			this.parts.set(part._id, part)
		}
	}
	private _deleteIfChanged(partId: PartId) {
		if (this.parts.has(partId)) {
			this.parts.delete(partId)
		}
	}
}
