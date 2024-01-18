import { action, makeObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { ControllerMessage, ViewPort, ViewPortSchema } from '@sofie-prompter-editor/shared-model'
import { getCurrentTime } from '../lib/getCurrentTime.js'
import { literal } from '@sofie-automation/server-core-integration'

export class ControllerStore {
	public message = observable(
		{
			message: literal<ControllerMessage>({
				offset: null,
				speed: 0,
			}),
		},
		{
			message: observable.ref,
		}
	)
	constructor() {
		makeObservable(this, {
			updateMessage: action,
		})
	}
	updateMessage(message: ControllerMessage) {
		this.message.message = message
	}
}
