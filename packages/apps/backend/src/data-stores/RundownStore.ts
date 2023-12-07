import { action, makeObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { Rundown, RundownId } from '@sofie-prompter-editor/shared-model'

export class RundownStore {
	public readonly rundowns = observable.map<RundownId, Rundown>()

	constructor() {
		makeObservable(this, {
			updateRundown: action,
		})
	}

	updateRundown(rundownId: RundownId, rundown: Rundown | undefined) {
		if (rundown) {
			if (!isEqual(this.rundowns.get(rundown._id), rundown)) {
				this.rundowns.set(rundown._id, rundown)
			}
		} else {
			if (this.rundowns.has(rundownId)) {
				this.rundowns.delete(rundownId)
			}
		}
	}
}
