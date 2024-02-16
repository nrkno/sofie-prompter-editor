import { assertNever } from '@sofie-prompter-editor/shared-lib'
import { getOpenedXKeysPanels, requestXkeysPanels, setupXkeysPanel, XKeys } from 'xkeys-webhid'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigType, TriggerConfigXkeys } from '../triggerConfig'
import { AnyTriggerAction } from '../../triggerActions/triggerActions'

export class TriggerHandlerXKeys extends TriggerHandler<TriggerConfigXkeys> {
	private neededPanelIds = new Set<{
		productId: number | null
		unitId: number | null
	}>()

	private connectedPanels: XKeys[] = []

	async initialize(triggers?: TriggerConfig[]): Promise<void> {
		if (triggers) this.triggers = triggers
		// Make list of which panels we have triggers for:
		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.XKEYS) continue
			this.neededPanelIds.add({ productId: trigger.productId, unitId: trigger.unitId })
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const theWindow = window as any

		// hot-module-reload fix:
		if (!theWindow.xkeysInitialized) {
			theWindow.xkeysInitialized = true
			theWindow.xkeysConnectedPanels = this.connectedPanels

			// Get list of already opened panels and connect to them:
			const alreadyOpenedDevices = await getOpenedXKeysPanels()
			for (const device of alreadyOpenedDevices) {
				await this.connectToHIDDevice(device)
			}

			if (this.neededPanelIds.size > 0) {
				// We have triggers setup for panels we don't have access to.
				// Emit an event which will prompt the user to grant access:
				this.emit('requestHIDDeviceAccess', 'XKeys', (allow) => {
					this.allowAccess(allow)
				})
			}
		} else {
			this.connectedPanels = theWindow.xkeysConnectedPanels
		}

		this.triggerKeys = []
		this.triggerAnalog = []
		this.triggerXYZ = []
		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.XKEYS) continue

			if (trigger.eventType === 'down' || trigger.eventType === 'up') {
				this.triggerKeys.push(trigger)
			} else if (
				trigger.eventType === 'jog' ||
				trigger.eventType === 'rotary' ||
				trigger.eventType === 'shuttle' ||
				trigger.eventType === 'tbar'
			) {
				this.triggerAnalog.push(trigger)
			} else if (trigger.eventType === 'trackball' || trigger.eventType === 'joystick') {
				this.triggerXYZ.push(trigger)
			} else {
				assertNever(trigger.eventType)
			}
		}

		for (const xkeys of this.connectedPanels) {
			xkeys.removeAllListeners('down')
			xkeys.removeAllListeners('up')
			xkeys.removeAllListeners('jog')
			xkeys.removeAllListeners('rotary')
			xkeys.removeAllListeners('shuttle')
			xkeys.removeAllListeners('tbar')
			xkeys.removeAllListeners('trackball')
			xkeys.removeAllListeners('joystick')

			xkeys.setAllBacklights(false)

			xkeys.on('error', (e) => {
				console.error('xkeys error', e)
			})
			xkeys.on('down', (keyIndex: number) => {
				this._doKeyAction(xkeys, 'down', keyIndex)
			})
			xkeys.on('up', (keyIndex: number) => {
				this._doKeyAction(xkeys, 'up', keyIndex)
			})
			xkeys.on('jog', (index, value) => {
				this._doAnalogAction(xkeys, 'jog', index, value, 7) // [0, 7]
			})
			xkeys.on('rotary', (index, value) => {
				this._doAnalogAction(xkeys, 'rotary', index, value, 8)
			})
			xkeys.on('shuttle', (index, value) => {
				this._doAnalogAction(xkeys, 'shuttle', index, value, 7)
			})
			xkeys.on('tbar', (index, value) => {
				this._doAnalogAction(xkeys, 'tbar', index, value, -127, 127) // [-127, 127]
			})
			xkeys.on('trackball', (index, value) => {
				this.doXYZAction(xkeys, 'trackball', index, value)
			})

			xkeys.on('joystick', (index, value) => {
				this.doXYZAction(xkeys, 'joystick', index, value)
			})
		}
	}
	allowAccess(allow: boolean) {
		if (allow) {
			this.requestXkeysPanels().catch(console.error)
		}
	}
	private async requestXkeysPanels() {
		//  Must be handling a user gesture to show a permission request

		// Connect to a new panel:
		const newDevices = await requestXkeysPanels()
		for (const device of newDevices) {
			await this.connectToHIDDevice(device)
		}
		await this.initialize()
	}
	async destroy(): Promise<void> {
		await Promise.all(this.connectedPanels.map((xkeys) => xkeys.close()))
	}

	private async connectToHIDDevice(device: HIDDevice) {
		const xkeys = await setupXkeysPanel(device)

		const matches = this.matchNeededPanel(xkeys.info.productId, xkeys.info.unitId)
		for (const match of matches) {
			this.neededPanelIds.delete(match)
		}
		if (matches.length > 0) {
			this.connectedPanels.push(xkeys)
		} else {
			await xkeys.close()
		}
	}

	private matchNeededPanel(productId: number, unitId: number) {
		const matched: {
			productId: number | null
			unitId: number | null
		}[] = []
		for (const needed of this.neededPanelIds.values()) {
			if (
				(needed.productId === null || needed.productId === productId) &&
				(needed.unitId === null || needed.unitId === unitId)
			) {
				matched.push(needed)
			}
		}
		return matched
	}
	/** Generate an action from a key input */
	private _doKeyAction(xkeys: XKeys, eventType: TriggerConfigXkeys['eventType'], keyIndex: number): void {
		const action = this.getKeyAction(
			(t) =>
				(t.productId === null || t.productId === xkeys.info.productId) &&
				(t.unitId === null || t.unitId === xkeys.info.unitId) &&
				t.eventType === eventType &&
				t.index === keyIndex
		)
		if (action) this.emit('action', action)
		else console.log('Xkeys', eventType, xkeys.info.productId, xkeys.info.unitId, keyIndex)
	}

	/** Generate an action from a "analog type" input */
	private _doAnalogAction(
		xkeys: XKeys,
		eventType: TriggerConfigXkeys['eventType'],
		index: number,
		value: number,
		scaleMaxValue = 1,
		zeroValue = 0
	): void {
		const action = this.getAnalogAction(
			(t) =>
				(t.productId === null || t.productId === xkeys.info.productId) &&
				(t.unitId === null || t.unitId === xkeys.info.unitId) &&
				t.eventType === eventType &&
				t.index === index,
			value,
			{
				scaleMaxValue,
				zeroValue,
			}
		)

		if (action) this.emit('action', action)
		else console.log('Xkeys', eventType, xkeys.info.productId, xkeys.info.unitId, index, value)
	}
	/** Generate an action from a "XYZ type" input */
	private doXYZAction(
		xkeys: XKeys,
		eventType: TriggerConfigXkeys['eventType'],
		index: number,
		xyz: { x: number; y: number; z?: number }
	): void {
		const action = this.getXYZAction(
			(t) =>
				(t.productId === null || t.productId === xkeys.info.productId) &&
				(t.unitId === null || t.unitId === xkeys.info.unitId) &&
				t.eventType === eventType &&
				t.index === index,
			xyz,
			xyz.y
		)

		if (action) this.emit('action', action)
		else console.log('Xkeys', eventType, xkeys.info.productId, xkeys.info.unitId, index, xyz)
	}
}
