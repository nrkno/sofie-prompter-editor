import { observable, action } from 'mobx'
import { EventEmitter } from 'eventemitter3'

import { APIConnection, RootAppStore } from './RootAppStore'
import { hardCodedTriggers } from '../lib/triggers/triggers'

import { TriggerHandlerEvents } from '../lib/triggers/triggerHandlers/TriggerHandler'
import { TriggerHandlerXKeys } from '../lib/triggers/triggerHandlers/TriggerHandlerXKeys'
import { TriggerHandlerKeyboard } from '../lib/triggers/triggerHandlers/TriggerHandlerKeyboard'
import { TriggerHandlerStreamdeck } from '../lib/triggers/triggerHandlers/TriggerHandlerStreamdeck'
import { TriggerHandlerSpaceMouse } from '../lib/triggers/triggerHandlers/TriggerHandlerSpaceMouse'
import { TriggerHandlerJoycon } from '../lib/triggers/triggerHandlers/TriggerHandlerJoycon.ts'

export interface TriggerStoreEvents {
	action: TriggerHandlerEvents['action']
}
/**
 * The TriggerStore is responsible for listening to triggers (eg keyboard shortcuts) and dispatching action events
 */
export class TriggerStore extends EventEmitter<TriggerStoreEvents> {
	/**
	 * When set, indicates that a TriggerHandler wants to request access to some Browser API that requires user interaction.
	 * Examples include Web HID, Web MIDI, Web Serial, etc.
	 * The callback needs to be called as a part of an event handler for a user action.
	 */
	public apiAccessRequests = observable.map<
		string,
		{
			deviceName: string
			callback: (allow: boolean) => void
		}
	>()

	private triggers = hardCodedTriggers
	private triggerHandlers = [
		new TriggerHandlerKeyboard(),
		new TriggerHandlerXKeys(),
		new TriggerHandlerStreamdeck(),
		new TriggerHandlerSpaceMouse(),
		new TriggerHandlerJoycon(),
	]

	constructor(public appStore: typeof RootAppStore, public connection: APIConnection) {
		super()

		for (const triggerHandler of this.triggerHandlers) {
			// Just pipe action events through:
			triggerHandler.on('action', (...args) => this.emit('action', ...args))

			// Handle requests for HIDDevice access:
			// HIDDevice access requests can only be initiated by a user action,
			// this event indicates that a TriggerHandler wants to request access to a HIDDevice
			// The user will then be prompted to allow access to the device, and the callback will be called
			triggerHandler.on(
				'requestHIDDeviceAccess',
				action((deviceName: string, callback: (allow: boolean) => void) => {
					const key = triggerHandler.constructor.name
					this.apiAccessRequests.set(key, {
						deviceName,
						callback: (allow: boolean) => {
							this.apiAccessRequests.delete(key)
							callback(allow)
						},
					})
				})
			)
		}

		this.initialize().catch(console.error)
	}

	private async initialize() {
		for (const triggerHandler of this.triggerHandlers) {
			await triggerHandler.initialize(this.triggers)
		}
	}

	async destroy() {
		for (const triggerHandler of this.triggerHandlers) {
			await triggerHandler.destroy()
		}
	}
}
