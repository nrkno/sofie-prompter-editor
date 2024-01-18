import { action, makeAutoObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { SystemStatus } from '@sofie-prompter-editor/shared-model'

export class SystemStatusStore {
	public systemStatus = observable.box<SystemStatus>({
		statusMessage: '',
		connectedToCore: false,
	})

	constructor() {
		makeAutoObservable(this, {
			patch: action,
		})
	}

	patch(patchData: Partial<SystemStatus>) {
		const oldData = this.systemStatus.get()
		const data = {
			...oldData,
			...patchData,
		}
		if (!isEqual(data, oldData)) {
			this.systemStatus.set(data)
		}
	}
}
