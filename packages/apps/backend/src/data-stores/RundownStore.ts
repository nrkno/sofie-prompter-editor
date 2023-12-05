import { action, makeAutoObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { Rundown, RundownId } from 'packages/shared/model/dist'

export class RundownStore {
	ready: boolean = false
	public readonly rundowns = observable.map<RundownId, Rundown>()

	constructor() {
		makeAutoObservable(this, {
			create: action,
			update: action,
			remove: action,
		})
	}

	create(rundown: Rundown) {
		this._updateIfChanged(rundown)
	}
	update(rundown: Rundown) {
		this._updateIfChanged(rundown)
	}
	remove(rundownId: RundownId) {
		this._deleteIfChanged(rundownId)
	}

	private _updateIfChanged(rundown: Rundown) {
		if (!isEqual(this.rundowns.get(rundown._id), rundown)) {
			this.rundowns.set(rundown._id, rundown)
		}
	}
	private _deleteIfChanged(rundownId: RundownId) {
		if (this.rundowns.has(rundownId)) {
			this.rundowns.delete(rundownId)
		}
	}
}
