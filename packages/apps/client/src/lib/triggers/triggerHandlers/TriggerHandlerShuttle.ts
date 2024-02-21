import { assertNever } from '@sofie-prompter-editor/shared-lib'
import { getOpenedDevices, requestAccess, setupShuttle, Shuttle, VENDOR_IDS } from 'shuttle-webhid'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigType, TriggerConfigShuttle } from '../triggerConfig'

export class TriggerHandlerShuttle extends TriggerHandler<TriggerConfigShuttle> {
	private neededDeviceIds = new Set<{
		productId: TriggerConfigShuttle['productId']
	}>()

	private connectedPanels: Shuttle[] = []

	async initialize(triggers?: TriggerConfig[]): Promise<void> {
		if (triggers) this.triggers = triggers
		// Make list of which panels we have triggers for:
		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.SHUTTLE) continue
			this.neededDeviceIds.add({ productId: trigger.productId })
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const theWindow = window as any

		// hot-module-reload fix:
		if (!theWindow.shuttleInitialized) {
			theWindow.shuttleInitialized = true
			theWindow.shuttleConnectedPanels = this.connectedPanels

			// Get list of already opened panels and connect to them:
			const alreadyOpenedDevices = await getOpenedDevices()
			for (const device of alreadyOpenedDevices) {
				if (!VENDOR_IDS.includes(device.vendorId)) continue

				await this.connectToHIDDevice(device)
			}

			if (this.neededDeviceIds.size > 0) {
				// We have triggers setup for panels we don't have access to.
				// Emit an event which will prompt the user to grant access:
				this.emit('requestHIDDeviceAccess', 'ShuttleXpress / PRO controller', (allow) => {
					this.allowAccess(allow)
				})
			}
		} else {
			this.connectedPanels = theWindow.shuttleConnectedPanels
		}

		this.triggerKeys = []
		this.triggerAnalog = []
		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.SHUTTLE) continue

			if (trigger.eventType === 'down' || trigger.eventType === 'up') {
				this.triggerKeys.push(trigger)
			} else if (trigger.eventType === 'jog' || trigger.eventType === 'shuttle') {
				this.triggerAnalog.push(trigger)
			} else {
				assertNever(trigger.eventType)
			}
		}

		for (const panel of this.connectedPanels) {
			panel.removeAllListeners('error')
			panel.removeAllListeners('down')
			panel.removeAllListeners('up')
			panel.removeAllListeners('jog')
			panel.removeAllListeners('shuttle')

			panel.on('error', (e) => {
				console.error('shuttle error', e)
			})
			panel.on('down', (keyIndex: number) => {
				this.doKeyAction(panel, 'down', keyIndex)
			})
			panel.on('up', (keyIndex: number) => {
				this.doKeyAction(panel, 'up', keyIndex)
			})

			panel.on('jog', (delta) => {
				// const xyz = {
				// 	x: value.pitch,
				// 	y: value.roll,
				// 	z: value.yaw,
				// }
				this.doAnalogAction(panel, 'jog', delta)
			})
			panel.on('shuttle', (value) => {
				this.doAnalogAction(panel, 'shuttle', value)
			})
		}
	}
	allowAccess(allow: boolean) {
		if (allow) {
			this.requestShuttlePanels().catch(console.error)
		}
	}
	private async requestShuttlePanels() {
		//  Must be handling a user gesture to show a permission request

		// Connect to a new panel:
		const newDevices = await requestAccess()
		for (const device of newDevices) {
			await this.connectToHIDDevice(device)
		}
		await this.initialize()
	}
	async destroy(): Promise<void> {
		await Promise.all(this.connectedPanels.map((panel) => panel.close()))
	}

	private async connectToHIDDevice(device: HIDDevice) {
		const panel = await setupShuttle(device)

		const matches = this.matchNeededPanel(panel.info.productId)
		for (const match of matches) {
			this.neededDeviceIds.delete(match)
		}
		if (matches.length > 0) {
			this.connectedPanels.push(panel)
		} else {
			await panel.close()
		}
	}

	private matchNeededPanel(productId: number) {
		const matched: {
			productId: number | null
		}[] = []
		for (const needed of this.neededDeviceIds.values()) {
			if (needed.productId === null || needed.productId === productId) {
				matched.push(needed)
			}
		}
		return matched
	}
	/** Generate an action from a key input */
	private doKeyAction(panel: Shuttle, eventType: TriggerConfigShuttle['eventType'], keyIndex: number): void {
		const action = this.getKeyAction(
			(t) =>
				(t.productId === null || t.productId === panel.info.productId) &&
				t.eventType === eventType &&
				t.index === keyIndex
		)
		if (action) this.emit('action', action)
		else console.log('Shuttle', eventType, panel.info.productId, keyIndex)
	}
	/** Generate an action from a "analog type" input */
	private doAnalogAction(
		panel: Shuttle,
		eventType: TriggerConfigShuttle['eventType'],

		value: number
	): void {
		const action = this.getAnalogAction(
			(t) =>
				(t.productId === null || t.productId === panel.info.productId) && t.eventType === eventType && t.index === 0,
			value,
			{}
		)
		if (action) this.emit('action', action)
		else console.log('Shuttle', eventType, panel.info.productId, value)
	}
}
