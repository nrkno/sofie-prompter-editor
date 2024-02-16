import { assertNever } from '@sofie-prompter-editor/shared-lib'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigType, TriggerConfigJoycon } from '../triggerConfig'

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
	private prevButtons: Record<number, Record<number, number>> = {}

	private hasAnyJoyConTriggers = false

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

	private remapButtons(mode: JoyconMode, keyIndex: number): TriggerConfigJoycon['button'] | undefined {
		/*
		  This function remaps buttons to keys representing roughly the same buttons on both joycons
		  Virtual button indexes:
		  * left
		  * down
		  * up
		  * right
		  * LR (L or R)
		  * Z
		  * home (or "snapshot")
		  * sign ( + or - )
		  * stick (press stick)
		*/

		let remapping: Record<number, TriggerConfigJoycon['button']> = {}

		if (mode === 'L') {
			// Button overview JoyCon L single mode
			// Arrows: Left = '0', Down = '1', Up = '2', Right = '3'
			// Others: SL = '4', SR = '5', ZL = '6', L = '8', - = '9', Joystick = '10', Snapshot = '16'
			remapping = {
				[0]: 'left', // left
				[1]: 'down', // down
				[2]: 'up', //up
				[3]: 'right', // right
				// [4]: -1, // SL
				// [5]: -1, // SR
				[6]: 'Z', // ZL -> Z
				// [7]: ,
				[8]: 'LR', // L
				[9]: 'sign', // - -> Sign
				[10]: 'stickpress', // Stick down
				[16]: 'home', // Snapshot -> home
			}
		} else if (mode === 'R') {
			// Button overview JoyCon R single mode
			// "Arrows": A = '0', X = '1', B = '2', Y = '3'
			// Others: SL = '4', SR = '5', ZR = '7', R = '8', + = '9', Joystick = '10', Home = '16'

			remapping = {
				[0]: 'right', // A -> right
				[1]: 'up', //  X -> up
				[2]: 'down', // B -> down
				[3]: 'left', // Y -> left
				// [4]: -1, // SL
				// [5]: -1, // SR
				// [6]: , //
				[7]: 'Z', // ZR -> Z
				[8]: 'LR', // R -> L/R
				[9]: 'sign', // + -> Sign
				[10]: 'stickpress', // Stick
				[16]: 'home', // Home
			}
		} else if (mode === 'LR') {
			// Button overview JoyCon L+R paired mode
			// L JoyCon Arrows: B = '0', A = '1', Y = '2', X = '3'
			// L JoyCon Others: L = '4', ZL = '6', - = '8', Joystick = '10', Snapshot = '17', SL = '18', SR = '19'
			// R JoyCon "Arrows": B = '0', A = '1', Y = '2', X = '3'
			// R JoyCon Others: R = '5', ZR = '7', + = '9', Joystick = '11', Home = '16', SL = '20', SR = '21'

			remapping = {
				[0]: 'down', // B -> down
				[1]: 'right', // A -> right
				[2]: 'left', // Y -> left
				[3]: 'up', // X -> up
				[4]: 'LR', // L -> L/R
				[5]: 'LR', // R -> L/R
				[6]: 'Z', // ZL -> Z
				[7]: 'Z', // ZR -> Z
				[8]: 'sign', // - -> sign
				[9]: 'sign', // + -> sign
				[10]: 'stickpress', // stick down (right controller)
				[11]: 'stickpress', // stick down (right controller)
				[12]: 'up', // up
				[13]: 'down', // down
				[14]: 'left', // left
				[15]: 'right', // right
				[16]: 'home', // Home
				[17]: 'home', // snapshot -> home
				// [18]: -1, // SL
				// [19]: -1, // SR
				// [20]: -1, // SL (right controller)
				// [21]: -1, // SR (right controller)
			}
		}

		return remapping[keyIndex]
	}

	private updateJoyConsPosition(): void {
		if (this.updateJoyConsHandle !== undefined) window.cancelAnimationFrame(this.updateJoyConsHandle)
		if (this.destroyed) return

		const joycons = this.getJoyconData()
		if (!joycons?.length) return // No joycons connected, break the loop

		const stickValue = this.calculateStickValue(joycons)
		if (stickValue !== this.prevStickValue) {
			this.prevStickValue = stickValue

			console.log('stickValue', stickValue)
			this._doAnalogAction('stick', stickValue)
		}

		for (const joycon of joycons) {
			const prevButtons = this.prevButtons[joycon.index] || (this.prevButtons[joycon.index] = {})

			for (let i = 0; i < joycon.buttons.length; i++) {
				const value = joycon.buttons[i]
				if ((prevButtons[i] ?? 0) !== value) {
					const button = this.remapButtons(joycon.mode, i)

					if (button) {
						if (value) this._doKeyAction('down', button)
						else this._doKeyAction('up', button)
					}

					prevButtons[i] = value
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
	private _doKeyAction(eventType: TriggerConfigJoycon['eventType'], button: TriggerConfigJoycon['button']): void {
		const action = this.getKeyAction((t) => t.eventType === eventType && t.button === button)
		if (action) this.emit('action', action)
		else console.log('Joycon', eventType, button)
	}

	/** Generate an action from a "analog type" input */
	private _doAnalogAction(eventType: TriggerConfigJoycon['eventType'], value: number): void {
		const action = this.getAnalogAction((t) => t.eventType === eventType, value, {
			invert: true,
		})

		if (action) this.emit('action', action)
		else console.log('Joycon', eventType, value)
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
