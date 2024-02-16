import { assertNever } from '@sofie-prompter-editor/shared-lib'
import { getStreamDecks, requestStreamDecks, DeviceModelId, StreamDeckWeb } from '@elgato-stream-deck/webhid'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigStreamdeck, TriggerConfigType } from '../triggerConfig'
import { AnyTriggerAction } from '../../triggerActions/triggerActions'
import { Buffer as WebBuffer } from 'buffer'
window.Buffer = WebBuffer // This is a polyfill to get the Streamdeck working in the browser

export class TriggerHandlerStreamdeck extends TriggerHandler<TriggerConfigStreamdeck> {
	private neededPanelIds = new Set<{
		modelId: DeviceModelId | null
		serialNumber: string | null
	}>()

	private connectedPanels: StreamDeckWeb[] = []

	async initialize(triggers?: TriggerConfig[]): Promise<void> {
		if (triggers) this.triggers = triggers
		// Make list of which panels we have triggers for:
		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.STREAMDECK) continue
			this.neededPanelIds.add({ modelId: trigger.modelId, serialNumber: trigger.serialNumber })
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const theWindow = window as any

		// hot-module-reload fix:
		if (!theWindow.streamdeckInitialized) {
			theWindow.streamdeckInitialized = true
			theWindow.streamdeckConnectedPanels = this.connectedPanels

			// Get list of already opened panels and connect to them:
			const alreadyOpenedPanel = await getStreamDecks()
			for (const panel of alreadyOpenedPanel) {
				await this.connectToHIDDevice(panel)
			}

			if (this.neededPanelIds.size > 0) {
				// We have triggers setup for panels we don't have access to.
				// Emit an event which will prompt the user to grant access:
				this.emit('requestHIDDeviceAccess', 'Streamdeck', (allow) => {
					this.allowAccess(allow)
				})
			}
		} else {
			this.connectedPanels = theWindow.streamdeckConnectedPanels
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

			const serialNumber = await panel.getSerialNumber()

			panel.on('error', (e) => {
				console.error('streamdeck error', e)
			})
			panel.on('down', (keyIndex: number) => {
				this.doKeyAction(panel, serialNumber, 'down', keyIndex)
			})
			panel.on('up', (keyIndex: number) => {
				this.doKeyAction(panel, serialNumber, 'up', keyIndex)
			})
			panel.on('rotateLeft', (index: number, value) => {
				this.doAnalogAction(panel, serialNumber, 'rotate', index, -value)
			})
			panel.on('rotateRight', (index: number, value) => {
				this.doAnalogAction(panel, serialNumber, 'rotate', index, value)
			})
			panel.on('encoderDown', (index: number) => {
				this.doKeyAction(panel, serialNumber, 'encoderDown', index)
			})
			panel.on('encoderUp', (index: number) => {
				this.doKeyAction(panel, serialNumber, 'encoderUp', index)
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
	private doKeyAction(
		panel: StreamDeckWeb,
		serialNumber: string,
		eventType: TriggerConfigStreamdeck['eventType'],
		keyIndex: number
	): void {
		const action = this.getKeyAction(
			(t) =>
				(t.modelId === null || t.modelId === panel.MODEL) &&
				(t.serialNumber === null || t.serialNumber === serialNumber) &&
				t.eventType === eventType &&
				t.index === keyIndex
		)
		if (action) this.emit('action', action)
		else console.log('Streamdeck', eventType, panel.MODEL, serialNumber, keyIndex)
	}
	/** Generate an action from a "analog type" input */
	private doAnalogAction(
		panel: StreamDeckWeb,
		serialNumber: string,
		eventType: TriggerConfigStreamdeck['eventType'],
		index: number,
		value: number
	): void {
		const action = this.getAnalogAction(
			(t) =>
				(t.modelId === null || t.modelId === panel.MODEL) &&
				(t.serialNumber === null || t.serialNumber === serialNumber) &&
				t.eventType === eventType &&
				t.index === index,
			value,
			{}
		)
		if (action) this.emit('action', action)
		else console.log('Streamdeck', eventType, panel.MODEL, serialNumber, index, value)
	}
}
