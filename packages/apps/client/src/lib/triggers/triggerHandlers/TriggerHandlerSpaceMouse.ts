import { assertNever } from '@sofie-prompter-editor/shared-lib'
import { getOpenedSpaceMice, requestSpaceMice, setupSpaceMouse, SpaceMouse, VENDOR_IDS } from 'spacemouse-webhid'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigType, TriggerConfigSpacemouse } from '../triggerConfig'

export class TriggerHandlerSpaceMouse extends TriggerHandler<TriggerConfigSpacemouse> {
	private neededPanelIds = new Set<{
		productId: TriggerConfigSpacemouse['productId']
	}>()

	private connectedPanels: SpaceMouse[] = []

	async initialize(triggers?: TriggerConfig[]): Promise<void> {
		if (triggers) this.triggers = triggers
		// Make list of which panels we have triggers for:
		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.SPACEMOUSE) continue
			this.neededPanelIds.add({ productId: trigger.productId })
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const theWindow = window as any

		// hot-module-reload fix:
		if (!theWindow.spacemouseInitialized) {
			theWindow.spacemouseInitialized = true
			theWindow.spacemouseConnectedPanels = this.connectedPanels

			// Get list of already opened panels and connect to them:
			const alreadyOpenedDevices = await getOpenedSpaceMice()
			for (const device of alreadyOpenedDevices) {
				if (!VENDOR_IDS.includes(device.vendorId)) continue

				await this.connectToHIDDevice(device)
			}

			if (this.neededPanelIds.size > 0) {
				// We have triggers setup for panels we don't have access to.
				// Emit an event which will prompt the user to grant access:
				this.emit('requestHIDDeviceAccess', 'SpaceMouse / SpaceNavigator', (allow) => {
					this.allowAccess(allow)
				})
			}
		} else {
			this.connectedPanels = theWindow.spacemouseConnectedPanels
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
				this.doKeyAction(panel, 'down', keyIndex)
			})
			panel.on('up', (keyIndex: number) => {
				this.doKeyAction(panel, 'up', keyIndex)
			})

			panel.on('rotate', (value) => {
				const xyz = {
					x: value.pitch,
					y: value.roll,
					z: value.yaw,
				}
				this.doXYZAction(panel, 'rotate', xyz)
			})
			panel.on('translate', (zyz) => {
				this.doXYZAction(panel, 'translate', zyz)
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
	onPrompterState(): void {
		// Nothing
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
	private doKeyAction(panel: SpaceMouse, eventType: TriggerConfigSpacemouse['eventType'], keyIndex: number): void {
		const action = this.getKeyAction(
			(t) =>
				(t.productId === null || t.productId === panel.info.productId) &&
				t.eventType === eventType &&
				t.index === keyIndex
		)
		if (action) this.emit('action', action)
		else console.log('SpaceMouse', eventType, panel.info.productId, keyIndex)
	}
	/** Generate an action from a "XYZ type" input */
	private doXYZAction(
		panel: SpaceMouse,
		eventType: TriggerConfigSpacemouse['eventType'],
		xyz: { x: number; y: number; z: number }
	): void {
		const action = this.getXYZAction(
			(t) =>
				(t.productId === null || t.productId === panel.info.productId) && t.eventType === eventType && t.index === 0,
			xyz,
			xyz.x + xyz.y + xyz.z,
			{
				scaleMaxValue: 127,
			}
		)

		if (action) this.emit('action', action)
		else console.log('SpaceMouse', eventType, panel.info.productId, xyz)
	}
}
