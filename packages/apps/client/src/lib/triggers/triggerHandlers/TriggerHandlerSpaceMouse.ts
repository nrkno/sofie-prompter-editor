import { assertNever } from '@sofie-prompter-editor/shared-lib'
import { getOpenedSpaceMice, requestSpaceMice, setupSpaceMouse, SpaceMouse, VENDOR_IDS } from 'spacemouse-webhid'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigType, TriggerConfigSpacemouse } from '../triggerConfig'
import { AnyTriggerAction } from '../triggerActions'

export class TriggerHandlerSpaceMouse extends TriggerHandler {
	private neededPanelIds = new Set<{
		productId: number | null
	}>()

	private connectedPanels: SpaceMouse[] = []

	private triggerKeys: TriggerConfigSpacemouse[] = []
	private triggerXYZ: TriggerConfigSpacemouse[] = []

	async initialize(triggers?: TriggerConfig[]): Promise<void> {
		if (triggers) this.triggers = triggers
		// Make list of which panels we have triggers for:
		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.SPACEMOUSE) continue
			this.neededPanelIds.add({ productId: trigger.productId })
		}

		// hot-module-reload fix:
		if (!(window as any).spacemouseInitialized) {
			;(window as any).spacemouseInitialized = true
			;(window as any).spacemouseConnectedPanels = this.connectedPanels

			// Get list of already opened panels and connect to them:
			const alreadyOpenedDevices = await getOpenedSpaceMice()
			for (const device of alreadyOpenedDevices) {
				if (!VENDOR_IDS.includes(device.vendorId)) continue

				await this.connectToHIDDevice(device)
			}

			if (this.neededPanelIds.size > 0) {
				// We have triggers setup for panels we don't have access to.
				// Emit an event which will prompt the user to grant access:
				this.emit('requestSpacemouseAccess')
			}
		} else {
			this.connectedPanels = (window as any).spacemouseConnectedPanels
		}

		this.triggerKeys = []
		this.triggerXYZ = []
		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.SPACEMOUSE) continue

			if (trigger.eventType === 'down' || trigger.eventType === 'up') {
				this.triggerKeys.push(trigger)
			} else if (trigger.eventType === 'rotate' || trigger.eventType === 'translate') {
				this.triggerXYZ.push(trigger)
			} else {
				assertNever(trigger.eventType)
			}
		}

		for (const panel of this.connectedPanels) {
			panel.removeAllListeners('error')
			panel.removeAllListeners('down')
			panel.removeAllListeners('up')
			panel.removeAllListeners('rotate')
			panel.removeAllListeners('translate')

			panel.on('error', (e) => {
				console.error('spacemouse error', e)
			})
			panel.on('down', (keyIndex: number) => {
				const action = this.getKeyAction('down', keyIndex)
				if (action) this.emit('action', action)
			})
			panel.on('up', (keyIndex: number) => {
				const action = this.getKeyAction('up', keyIndex)
				if (action) this.emit('action', action)
			})

			panel.on('rotate', (value) => {
				const xyz = {
					x: value.pitch,
					y: value.roll,
					z: value.yaw,
				}
				const action = this.getXYZAction('rotate', xyz)
				if (action) this.emit('action', action)
			})
			panel.on('translate', (zyz) => {
				const action = this.getXYZAction('translate', zyz)
				if (action) this.emit('action', action)
			})
		}
	}
	allowAccess(allow: boolean) {
		if (allow) {
			this.requestSpacemousePanels().catch(console.error)
		}
	}
	private async requestSpacemousePanels() {
		//  Must be handling a user gesture to show a permission request

		// Connect to a new panel:
		const newDevices = await requestSpaceMice()
		for (const device of newDevices) {
			await this.connectToHIDDevice(device)
		}
		await this.initialize()
	}
	async destroy(): Promise<void> {
		await Promise.all(this.connectedPanels.map((panel) => panel.close()))
	}

	private async connectToHIDDevice(device: HIDDevice) {
		const panel = await setupSpaceMouse(device)

		const matches = this.matchNeededPanel(panel.info.productId)
		for (const match of matches) {
			this.neededPanelIds.delete(match)
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
		for (const needed of this.neededPanelIds.values()) {
			if (needed.productId === null || needed.productId === productId) {
				matched.push(needed)
			}
		}
		return matched
	}
	/** Generate an action from a key input */
	private getKeyAction(eventType: string, keyIndex: number): AnyTriggerAction | undefined {
		const trigger: TriggerConfigSpacemouse | undefined = this.triggerKeys.find(
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
	/** Generate an action from a "XYZ type" input */
	private getXYZAction(eventType: string, xyz: { x: number; y: number; z: number }): AnyTriggerAction | undefined {
		const trigger: TriggerConfigSpacemouse | undefined = this.triggerXYZ.find((t) => t.eventType === eventType)
		if (!trigger) return undefined
		if ('payload' in trigger.action) return trigger.action // Already defined, just pass through

		if (trigger.action.type === 'prompterMove') {
			return {
				type: 'prompterMove',
				payload: { speed: xyz.x + xyz.y + xyz.z },
			}
		}
		return undefined
	}
}
