import { PartId, SegmentId, TextMarkerId } from '@sofie-prompter-editor/shared-model'
import { APIConnection, RootAppStore } from './RootAppStore'

export class ControlStore {
	constructor(public appStore: typeof RootAppStore, public connection: APIConnection) {}

	jumpToObject(objectId: SegmentId | PartId | TextMarkerId, offset: number = 0): void {
		console.log('jumpToObject', objectId)
		this.connection.controller
			.sendMessage({
				offset: {
					target: objectId,
					offset,
				},
				speed: null,
			})
			.then(() => console.log('sent!'))
			.catch(console.error)
	}
}
