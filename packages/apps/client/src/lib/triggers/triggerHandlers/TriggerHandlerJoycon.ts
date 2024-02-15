import { assertNever } from '@sofie-prompter-editor/shared-lib'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigType, TriggerConfigJoycon } from '../triggerConfig'
import { AnyTriggerAction } from '../../triggerActions/triggerActions'

export class TriggerHandlerJoycon extends TriggerHandler {
	// private neededPanelIds = new Set<{
	// 	controllerType: 'left' | 'right' | 'any'
	// 	// unitId: number | null
	// }>()

	private destroyed = false
	private updateJoyConsHandle: number | undefined = undefined

	// private joyconState = new Map<number, JoyconWithData>()
	private timestampOfLastUsedJoyconInput = 0

	// private invertJoystick = false // change scrolling direction for joystick
	private rangeRevMin = -1 // pedal "all back" position, the max-reverse-position
	// private rangeNeutralMin = -0.25 // pedal "back" position where reverse-range transistions to the neutral x
	// private rangeNeutralMax = 0.25 // pedal "front" position where scrolling starts, the 0 speed origin
	private rangeFwdMax = 1 // pedal "all front" position where scrolling is maxed out
	// private speedMap = [1, 2, 3, 4, 5, 8, 12, 30]
	// private reverseSpeedMap = [1, 2, 3, 4, 5, 8, 12, 30]
	private deadBand = 0.25

	// private connectedPanels: XKeys[] = []

	private prevSpeed = 0

	private hasAnyJoyConTriggers = false

	// private triggerKeys: TriggerConfigJoycon[] = []
	// private triggerAnalog: TriggerConfigJoycon[] = []
	// private triggerXYZ: TriggerConfigJoycon[] = []

	async initialize(triggers?: TriggerConfig[]): Promise<void> {
		if (triggers) this.triggers = triggers

		// Make list of which panels we have triggers for:
		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.JOYCON) continue
			this.hasAnyJoyConTriggers = true
			break
		}

		if (this.hasAnyJoyConTriggers) {
			window.addEventListener('gamepadconnected', () => {
				this.updateJoyConsPosition()
			})
			window.addEventListener('gamepaddisconnected', () => {
				this.updateJoyConsPosition()
			})

			this.updateJoyConsPosition()
		}
	}

	private updateJoyConsPosition(): void {
		if (this.updateJoyConsHandle !== undefined) window.cancelAnimationFrame(this.updateJoyConsHandle)
		if (this.destroyed) return

		const joycons = this.getJoyconData()
		if (!joycons?.length) return // No joycons connected, break the loop

		const speed = this.calculateSpeed(joycons)
		if (speed !== this.prevSpeed) {
			this.prevSpeed = speed

			// this.triggers
			for (const trigger of this.triggers) {
				if (trigger.type !== TriggerConfigType.JOYCON) continue
				if (trigger.eventType === 'speed') {
					if (trigger.action.type === 'prompterSetSpeed') {
						const action: AnyTriggerAction = {
							type: 'prompterSetSpeed',
							payload: { speed: speed },
						}
						this.emit('action', action)
					}
				}
			}
		}

		this.updateJoyConsHandle = window.requestAnimationFrame(() => {
			this.updateJoyConsHandle = undefined
			this.updateJoyConsPosition()
		})
	}
	private getJoyconData(): JoyconWithData[] | undefined {
		if (!navigator.getGamepads) return
		const gamepads = navigator.getGamepads()
		if (!(gamepads && typeof gamepads === 'object' && gamepads.length)) return

		const joyconInputs: JoyconWithData[] = []
		for (const gamepad of gamepads) {
			if (!gamepad) continue
			if (!gamepad.connected) continue

			if (typeof gamepad.id !== 'string') continue
			if (!gamepad.id.match('STANDARD GAMEPAD Vendor: 057e')) continue

			const mode =
				gamepad.axes.length === 4
					? 'LR' // for documentation: L+R mode is also identified as Vendor: 057e Product: 200e
					: gamepad.id.match('Product: 2006')
					? 'L'
					: gamepad.id.match('Product: 2007')
					? 'R'
					: null
			joyconInputs.push({
				index: gamepad.index,
				timestamp: gamepad.timestamp,
				mode,
				axes: gamepad.axes,
				buttons: gamepad.buttons.map((i) => i.value),
			})
		}
		return joyconInputs
	}
	private getActiveInputsOfJoycons(joycons: JoyconWithData[]): number {
		let lastSeenSpeed = 0
		// let used = ''

		for (const joycon of joycons) {
			// sort/filter by gamepad timestamp to use the most up-to-date input, in order to prevent the "stuck" dead joycon when going from pairs to singles
			if (joycon.timestamp >= this.timestampOfLastUsedJoyconInput) {
				// handle buttons at the same time as evaluating stick input
				// this.handleButtons(joycon)

				// handle speed input
				if (joycon.mode === 'L' || joycon.mode === 'R') {
					// L or R mode
					if (Math.abs(joycon.axes[0]) > this.deadBand) {
						if (joycon.mode === 'L') {
							lastSeenSpeed = joycon.axes[0] * -1 // in this mode, L is "negative"
						} else if (joycon.mode === 'R') {
							lastSeenSpeed = joycon.axes[0] * 1.4 // in this mode, R is "positive"
							// factor increased by 1.4 to account for the R joystick being less sensitive than L
						}
						this.timestampOfLastUsedJoyconInput = joycon.timestamp
					}
				} else if (joycon.mode === 'LR') {
					// L + R mode
					// get the first one that is moving outside of the deadband, prioritizing the L controller
					if (Math.abs(joycon.axes[1]) > this.deadBand) {
						lastSeenSpeed = joycon.axes[1] * -1 // in this mode, we are "negative" on both sticks....
					} else if (Math.abs(joycon.axes[3]) > this.deadBand) {
						lastSeenSpeed = joycon.axes[3] * -1.4 // in this mode, we are "negative" on both sticks....
						// factor increased by 1.4 to account for the R joystick being less sensitive than L
					}
					this.timestampOfLastUsedJoyconInput = joycon.timestamp
				}
			}
		}

		if (lastSeenSpeed !== 0) {
			// Adjust for dead band, so the output will be 0-1:
			lastSeenSpeed = Math.sign(lastSeenSpeed) * ((Math.abs(lastSeenSpeed) - this.deadBand) / (1 - this.deadBand))
		}
		// it is random which controller is evaluated last and ultimately takes control
		return lastSeenSpeed
	}
	private calculateSpeed(inputs: JoyconWithData[]): number {
		// start by clamping value to the legal range
		const inputValue: number = Math.min(
			Math.max(this.getActiveInputsOfJoycons(inputs), this.rangeRevMin),
			this.rangeFwdMax
		) // clamps in between rangeRevMin and rangeFwdMax

		return inputValue
	}

	async destroy(): Promise<void> {
		this.destroyed = true
		if (this.updateJoyConsHandle !== undefined) window.cancelAnimationFrame(this.updateJoyConsHandle)
	}
}

interface JoyconWithData {
	index: number
	timestamp: number
	mode: JoyconMode
	axes: readonly number[]
	buttons: number[]
}
type JoyconMode = 'L' | 'R' | 'LR' | null
