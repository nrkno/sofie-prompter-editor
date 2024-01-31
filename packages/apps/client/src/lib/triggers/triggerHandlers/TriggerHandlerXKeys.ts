import { assertNever } from '@sofie-prompter-editor/shared-lib'
import { getOpenedXKeysPanels, requestXkeysPanels, setupXkeysPanel, XKeys } from 'xkeys-webhid'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigType, TriggerConfigXkeys } from '../triggerConfig'
import { AnyTriggerAction } from '../../triggerActions/triggerActions'

export class TriggerHandlerXKeys extends TriggerHandler {
	private neededPanelIds = new Set<{
		productId: number | null
		unitId: number | null
	}>()

	private connectedPanels: XKeys[] = []

	private triggerKeys: TriggerConfigXkeys[] = []
	private triggerAnalog: TriggerConfigXkeys[] = []
	private triggerXYZ: TriggerConfigXkeys[] = []

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
				const action = this.getKeyAction('down', keyIndex)
				if (action) this.emit('action', action)
			})
			xkeys.on('up', (keyIndex: number) => {
				const action = this.getKeyAction('up', keyIndex)
				if (action) this.emit('action', action)
			})
			xkeys.on('jog', (index, value) => {
				const action = this.getAnalogAction('jog', index, value, 7)
				if (action) this.emit('action', action)
			})
			xkeys.on('rotary', (index, value) => {
				const action = this.getAnalogAction('rotary', index, value, 8)
				if (action) this.emit('action', action)
			})
			xkeys.on('shuttle', (index, value) => {
				const action = this.getAnalogAction('shuttle', index, value, 7)
				if (action) this.emit('action', action)
			})
			xkeys.on('tbar', (index, value) => {
				const action = this.getAnalogAction('tbar', index, value, 127, 127)
				if (action) this.emit('action', action)
			})
			xkeys.on('trackball', (index, value) => {
				const action = this.getXYZAction('trackball', index, value)
				if (action) this.emit('action', action)
			})

			xkeys.on('joystick', (index, value) => {
				const action = this.getXYZAction('joystick', index, value)
				if (action) this.emit('action', action)
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
	private getKeyAction(eventType: string, keyIndex: number): AnyTriggerAction | undefined {
		const trigger: TriggerConfigXkeys | undefined = this.triggerKeys.find(
			(t) => t.eventType === eventType && t.index === keyIndex
		)
		if (!trigger) return undefined

		if ('payload' in trigger.action) return trigger.action // Already defined, just pass through

		if (trigger.action.type === 'prompterMove') {
			// ignore
		} else if (trigger.action.type === 'prompterAccelerate') {
			// ignore
		} else if (trigger.action.type === 'prompterJump') {
			// ignore
		} else if (trigger.action.type === 'movePrompterToHere') {
			return {
				type: 'movePrompterToHere',
				payload: {},
			}
		} else {
			assertNever(trigger.action.type)
		}
		return undefined
	}
	/** Generate an action from a "analog type" input */
	private getAnalogAction(
		eventType: string,
		index: number,
		value: number,
		scaleMaxValue = 1,
		zeroValue = 0
	): AnyTriggerAction | undefined {
		const trigger: TriggerConfigXkeys | undefined = this.triggerAnalog.find(
			(t) => t.eventType === eventType && t.index === index
		)
		if (!trigger) return undefined

		if ('payload' in trigger.action) return trigger.action // Already defined, just pass through

		if (trigger.action.type === 'prompterMove') {
			const normalValue = (value - zeroValue) / scaleMaxValue
			return {
				type: 'prompterMove',
				payload: { speed: normalValue },
			}
		} else if (trigger.action.type === 'prompterAccelerate') {
			const normalValue = (value - zeroValue) / scaleMaxValue
			return {
				type: 'prompterAccelerate',
				payload: { accelerate: normalValue },
			}
		}
		return undefined
	}
	/** Generate an action from a "XYZ type" input */
	private getXYZAction(
		eventType: string,
		index: number,
		xyz: { x: number; y: number; z?: number }
	): AnyTriggerAction | undefined {
		const trigger: TriggerConfigXkeys | undefined = this.triggerXYZ.find(
			(t) => t.eventType === eventType && t.index === index
		)
		if (!trigger) return undefined
		if ('payload' in trigger.action) return trigger.action // Already defined, just pass through

		if (trigger.action.type === 'prompterMove') {
			return {
				type: 'prompterMove',
				payload: { speed: xyz.y },
			}
		} else if (trigger.action.type === 'prompterAccelerate') {
			return {
				type: 'prompterAccelerate',
				payload: { accelerate: xyz.y },
			}
		}
		return undefined
	}
}
