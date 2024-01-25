import { observable, action, flow, makeObservable, IReactionDisposer, reaction } from 'mobx'
import { EventEmitter } from 'eventemitter3'

import { APIConnection, RootAppStore } from './RootAppStore'
import { hardCodedTriggers } from '../lib/triggers/triggers'

import { TriggerHandlerEvents } from '../lib/triggers/triggerHandlers/TriggerHandler'
import { TriggerHandlerXKeys } from '../lib/triggers/triggerHandlers/TriggerHandlerXKeys'
import { TriggerHandlerKeyboard } from '../lib/triggers/triggerHandlers/TriggerHandlerKeyboard'
import { TriggerHandlerStreamdeck } from '../lib/triggers/triggerHandlers/TriggerHandlerStreamdeck'
import { TriggerHandlerSpaceMouse } from '../lib/triggers/triggerHandlers/TriggerHandlerSpaceMouse'

export interface TriggerStoreEvents {
	action: TriggerHandlerEvents['action']
}
/**
 * The TriggerStore is responsible for listening to triggers (eg keyboard shortcuts) and dispatching action events
 */
export class TriggerStore extends EventEmitter<TriggerStoreEvents> {
	// initialized = false
	// private initializing = false

	/** Is true when if xkeys requests access to HIDDevices */
	public xKeysRequestsAccess = false
	/** Is true when if streamdeck requests access to HIDDevices */
	public streamdeckRequestsAccess = false
	/** Is true when if space mouse requests access to HIDDevices */
	public spacemouseRequestsAccess = false

	reactions: IReactionDisposer[] = []

	private triggers = hardCodedTriggers
	private keyboard = new TriggerHandlerKeyboard()
	private xkeys = new TriggerHandlerXKeys()
	private streamdeck = new TriggerHandlerStreamdeck()
	private spacemouse = new TriggerHandlerSpaceMouse()

	constructor(public appStore: typeof RootAppStore, public connection: APIConnection) {
		super()
		makeObservable(this, {
			xKeysRequestsAccess: observable,
			streamdeckRequestsAccess: observable,
			// initialized: observable,
		})

		this.keyboard.on('action', (...args) => this.emit('action', ...args))
		this.xkeys.on('action', (...args) => this.emit('action', ...args))
		this.xkeys.on(
			'requestXkeysAccess',
			action(() => {
				this.xKeysRequestsAccess = true
			})
		)
		this.streamdeck.on('action', (...args) => this.emit('action', ...args))
		this.streamdeck.on(
			'requestStreamdeckAccess',
			action(() => {
				this.streamdeckRequestsAccess = true
			})
		)
		this.spacemouse.on('action', (...args) => this.emit('action', ...args))
		this.spacemouse.on(
			'requestSpacemouseAccess',
			action(() => {
				this.spacemouseRequestsAccess = true
			})
		)

		this.initialize().catch(console.error)
	}

	public xkeysAccess = action((allow: boolean) => {
		this.xKeysRequestsAccess = false
		this.xkeys.allowAccess(allow)
	})
	public streamdeckAccess = action((allow: boolean) => {
		this.streamdeckRequestsAccess = false
		this.streamdeck.allowAccess(allow)
	})
	public spacemouseAccess = action((allow: boolean) => {
		this.spacemouseRequestsAccess = false
		this.spacemouse.allowAccess(allow)
	})

	private async initialize() {
		await this.keyboard.initialize(this.triggers)
		await this.xkeys.initialize(this.triggers)
		await this.streamdeck.initialize(this.triggers)
		await this.spacemouse.initialize(this.triggers)
	}

	destroy = () => {
		this.reactions.forEach((dispose) => dispose())
	}
}
