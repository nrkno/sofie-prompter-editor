import { assertNever } from '@sofie-prompter-editor/shared-lib'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigType, TriggerConfigJoycon } from '../triggerConfig'
import { AnyTriggerAction } from '../../triggerActions/triggerActions'

export class TriggerHandlerJoycon extends TriggerHandler<TriggerConfigJoycon> {
	private destroyed = false
	private updateJoyConsHandle: number | undefined = undefined

	private timestampOfLastUsedJoyconInput = 0

	// private invertJoystick = false // change scrolling direction for joystick
	private rangeRevMin = -1 // pedal "all back" position, the max-reverse-position
	// private rangeNeutralMin = -0.25 // pedal "back" position where reverse-range transistions to the neutral x
	// private rangeNeutralMax = 0.25 // pedal "front" position where scrolling starts, the 0 speed origin
	private rangeFwdMax = 1 // pedal "all front" position where scrolling is maxed out
	// private speedMap = [1, 2, 3, 4, 5, 8, 12, 30]
	// private reverseSpeedMap = [1, 2, 3, 4, 5, 8, 12, 30]
	private deadBand = 0.25

	private prevStickValue = 0
	private prevButtons = new Map<number, number>()

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

			if (trigger.eventType === 'stick') {
				this.triggerAnalog.push(trigger)
			} else if (trigger.eventType === 'up' || trigger.eventType === 'down') {
				this.triggerKeys.push(trigger)
			} else assertNever(trigger.eventType)
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const theWindow = window as any
		// hot-module-reload fix:
		if (!theWindow.joyconInitialized) {
			theWindow.joyconInitialized = true
		} else {
			if (theWindow.joyconListenerCleanup) {
				theWindow.joyconListenerCleanup()
				delete theWindow.joyconListenerCleanup
			}
		}

		if (this.hasAnyJoyConTriggers) {
			const onConnectionChange = () => {
				this.updateJoyConsPosition()
			}
			window.addEventListener('gamepadconnected', onConnectionChange)
			window.addEventListener('gamepaddisconnected', onConnectionChange)

			theWindow.joyconListenerCleanup = () => {
				window.removeEventListener('gamepadconnected', onConnectionChange)
				window.removeEventListener('gamepaddisconnected', onConnectionChange)
			}
		}
	}

	private updateJoyConsPosition(): void {
		if (this.updateJoyConsHandle !== undefined) window.cancelAnimationFrame(this.updateJoyConsHandle)
		if (this.destroyed) return

		const joycons = this.getJoyconData()
		if (!joycons?.length) return // No joycons connected, break the loop

		const stickValue = this.calculateStickValue(joycons)
		if (stickValue !== this.prevStickValue) {
			this.prevStickValue = stickValue

			this._doAnalogAction('stick', 0, stickValue)
		}

		const buttons = new Map<number, number>()
		for (const i of this.prevButtons.keys()) {
			buttons.set(i, 0)
		}

		for (const joycon of joycons) {
			for (let i = 0; i < joycon.buttons.length; i++) {
				const value = joycon.buttons[i]
				if (value !== 0) {
					buttons.set(i, value)
				}
			}
		}
		for (const [i, value] of buttons) {
			if (value !== this.prevButtons.get(i)) {
				this.prevButtons.set(i, value)
				if (value) {
					this._doKeyAction('down', i)
				} else {
					this._doKeyAction('up', i)
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
	private calculateStickValue(inputs: JoyconWithData[]): number {
		// start by clamping value to the legal range
		const inputValue: number = Math.min(
			Math.max(this.getActiveInputsOfJoycons(inputs), this.rangeRevMin),
			this.rangeFwdMax
		) // clamps in between rangeRevMin and rangeFwdMax

		return round(inputValue, 0.01)
	}

	async destroy(): Promise<void> {
		this.destroyed = true
		if (this.updateJoyConsHandle !== undefined) window.cancelAnimationFrame(this.updateJoyConsHandle)
	}

	/** Generate an action from a key input */
	private _doKeyAction(eventType: TriggerConfigJoycon['eventType'], keyIndex: number): void {
		const action = this.getKeyAction((t) => t.eventType === eventType && t.index === keyIndex)
		if (action) this.emit('action', action)
		else console.log('Joycon', eventType, keyIndex)
	}

	/** Generate an action from a "analog type" input */
	private _doAnalogAction(eventType: TriggerConfigJoycon['eventType'], index: number, value: number): void {
		const action = this.getAnalogAction((t) => t.eventType === eventType && t.index === index, value, {})

		console.log(this.triggerAnalog)
		if (action) this.emit('action', action)
		else console.log('Joycon', eventType, index, value)
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
function round(value: number, minValue: number): number {
	return Math.round(value / minValue) * minValue
}
