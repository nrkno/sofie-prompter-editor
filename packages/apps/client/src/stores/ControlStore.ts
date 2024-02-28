import { ControllerMessage, PartId, SegmentId, TextMarkerId } from '@sofie-prompter-editor/shared-model'
import { APIConnection, RootAppStore } from './RootAppStore'
import { IReactionDisposer, action } from 'mobx'
import EventEmitter from 'eventemitter3'

interface ControlStoreEvents {
	message: [ControllerMessage]
}
export class ControlStore extends EventEmitter<ControlStoreEvents> {
	initialized = false
	private initializing = false

	reactions: IReactionDisposer[] = []

	constructor(public appStore: typeof RootAppStore, public connection: APIConnection) {
		super()
	}

	jumpToObject(objectId: SegmentId | PartId | TextMarkerId, offset: number = 0): void {
		this.connection.controller
			.sendMessage({
				offset: {
					target: objectId,
					offset,
				},
			})
			.catch(console.error)
	}
	public initialize() {
		if (this.initializing || this.initialized) return
		this.initializing = true

		this.setupSubscription()
	}

	private setupSubscription = action(() => {
		this.reactions.push(
			this.appStore.whenConnected(async () => {
				// Setup subscription and NOT load initial data:
				RootAppStore.connection.controller.subscribeToMessages().catch(console.error)

				this.initialized = true
			})
		)

		RootAppStore.connection.controller.on('message', (message) => {
			this.emit('message', message)
		})
	})
	dispose() {
		for (const dispose of this.reactions) {
			dispose()
		}
	}
}
