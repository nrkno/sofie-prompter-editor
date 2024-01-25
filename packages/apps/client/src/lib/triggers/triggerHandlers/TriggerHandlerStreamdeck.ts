import { assertNever } from '@sofie-prompter-editor/shared-lib'
import {
	getStreamDecks,
	requestStreamDecks,
	openDevice,
	DeviceModelId,
	StreamDeckWeb,
} from '@elgato-stream-deck/webhid'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigStreamdeck, TriggerConfigType } from '../triggerConfig'
import { AnyTriggerAction } from '../triggerActions'
import { Buffer as WebBuffer } from 'buffer'
window.Buffer = WebBuffer // This is a polyfill to get the Streamdeck working in the browser

export class TriggerHandlerStreamdeck extends TriggerHandler {
	private neededPanelIds = new Set<{
		modelId: DeviceModelId | null
		serialNumber: string | null
	}>()

	private connectedPanels: StreamDeckWeb[] = []

	private triggerKeys: TriggerConfigStreamdeck[] = []
	private triggerAnalog: TriggerConfigStreamdeck[] = []

	async initialize(triggers?: TriggerConfig[]): Promise<void> {
		if (triggers) this.triggers = triggers
		// Make list of which panels we have triggers for:
		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.STREAMDECK) continue
			this.neededPanelIds.add({ modelId: trigger.modelId, serialNumber: trigger.serialNumber })
		}

		// hot-module-reload fix:
		if (!(window as any).streamdeckInitialized) {
			;(window as any).streamdeckInitialized = true
			;(window as any).streamdeckConnectedPanels = this.connectedPanels

			// Get list of already opened panels and connect to them:
			const alreadyOpenedPanel = await getStreamDecks()
			for (const panel of alreadyOpenedPanel) {
				await this.connectToHIDDevice(panel)
			}

			if (this.neededPanelIds.size > 0) {
				// We have triggers setup for panels we don't have access to.
				// Emit an event which will prompt the user to grant access:
				this.emit('requestStreamdeckAccess')
			}
		} else {
			this.connectedPanels = (window as any).streamdeckConnectedPanels
		}

		this.triggerKeys = []
		this.triggerAnalog = []
		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.STREAMDECK) continue

			if (
				trigger.eventType === 'down' ||
				trigger.eventType === 'up' ||
				trigger.eventType === 'encoderDown' ||
				trigger.eventType === 'encoderUp'
			) {
				this.triggerKeys.push(trigger)
			} else if (trigger.eventType === 'rotate') {
				this.triggerAnalog.push(trigger)
			} else {
				assertNever(trigger.eventType)
			}
		}

		for (const panel of this.connectedPanels) {
			panel.removeAllListeners('error')
			panel.removeAllListeners('down')
			panel.removeAllListeners('up')
			panel.removeAllListeners('rotateLeft')
			panel.removeAllListeners('rotateRight')
			panel.removeAllListeners('encoderDown')
			panel.removeAllListeners('encoderUp')

			panel.on('error', (e) => {
				console.error('streamdeck error', e)
			})
			panel.on('down', (keyIndex: number) => {
				const action = this.getKeyAction('down', keyIndex)
				if (action) this.emit('action', action)
			})
			panel.on('up', (keyIndex: number) => {
				const action = this.getKeyAction('up', keyIndex)
				if (action) this.emit('action', action)
			})
			panel.on('rotateLeft', (index: number, value) => {
				const action = this.getAnalogAction('rotate', index, -value)
				if (action) this.emit('action', action)
			})
			panel.on('rotateRight', (index: number, value) => {
				const action = this.getAnalogAction('rotate', index, value)
				if (action) this.emit('action', action)
			})
			panel.on('encoderDown', (index: number) => {
				const action = this.getKeyAction('encoderDown', index)
				if (action) this.emit('action', action)
			})
			panel.on('encoderUp', (index: number) => {
				const action = this.getKeyAction('encoderUp', index)
				if (action) this.emit('action', action)
			})
		}
	}
	allowAccess(allow: boolean) {
		if (allow) {
			this.requestStreamdeckPanels().catch(console.error)
		}
	}
	private async requestStreamdeckPanels() {
		//  Must be handling a user gesture to show a permission request

		// Connect to a new panel:
		const newDevices = await requestStreamDecks()
		for (const device of newDevices) {
			await this.connectToHIDDevice(device)
		}
		await this.initialize()
	}
	async destroy(): Promise<void> {
		await Promise.all(this.connectedPanels.map((panel) => panel.close()))
	}

	private async connectToHIDDevice(panel: StreamDeckWeb) {
		const serialNumber = await panel.getSerialNumber()
		const matches = this.matchNeededPanel(panel.MODEL, serialNumber)
		for (const match of matches) {
			this.neededPanelIds.delete(match)
		}
		if (matches.length > 0) {
			this.connectedPanels.push(panel)
		} else {
			await panel.close()
		}
	}

	private matchNeededPanel(modelId: DeviceModelId, serialNumber: string) {
		const matched: {
			modelId: DeviceModelId | null
			serialNumber: string | null
		}[] = []
		for (const needed of this.neededPanelIds.values()) {
			if (
				(needed.modelId === null || needed.modelId === modelId) &&
				(needed.serialNumber === null || needed.serialNumber === serialNumber)
			) {
				matched.push(needed)
			}
		}
		return matched
	}
	/** Generate an action from a key input */
	private getKeyAction(eventType: string, keyIndex: number): AnyTriggerAction | undefined {
		const trigger: TriggerConfigStreamdeck | undefined = this.triggerKeys.find(
			(t) => t.eventType === eventType && t.index === keyIndex
		)
		if (!trigger) return undefined

		if ('payload' in trigger.action) return trigger.action // Already defined, just pass through

		if (trigger.action.type === 'prompterMove') {
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
	private getAnalogAction(eventType: string, index: number, value: number): AnyTriggerAction | undefined {
		const trigger: TriggerConfigStreamdeck | undefined = this.triggerAnalog.find(
			(t) => t.eventType === eventType && t.index === index
		)
		if (!trigger) return undefined

		if ('payload' in trigger.action) return trigger.action // Already defined, just pass through

		if (trigger.action.type === 'prompterMove') {
			return {
				type: 'prompterMove',
				payload: { speed: value },
			}
		}
		return undefined
	}
}
