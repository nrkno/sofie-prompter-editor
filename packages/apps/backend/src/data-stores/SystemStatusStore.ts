import { action, makeObservable, observable, toJS } from 'mobx'
import isEqual from 'lodash.isequal'
import { SystemStatus } from '@sofie-prompter-editor/shared-model'

export class SystemStatusStore {
	public systemStatus = observable.box<SystemStatus>({
		statusMessage: '',
		connectedToCore: false,
	})

	constructor() {
		makeObservable(this, {
			updateStatus: action,
		})
	}

	updateStatus(patchData: Partial<Omit<SystemStatus, 'statusMessage'>>) {
		const systemStatus = toJS(this.systemStatus.get())

		if (patchData.connectedToCore !== undefined) systemStatus.connectedToCore = patchData.connectedToCore

		// Generate systemMessage:
		systemStatus.statusMessage = null
		if (!systemStatus.connectedToCore) {
			systemStatus.statusMessage = 'Not connected to Core'
		}

		const oldData = toJS(this.systemStatus.get())
		if (!isEqual(oldData, systemStatus)) {
			this.systemStatus.set(systemStatus)
		}
	}
}
