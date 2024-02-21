import { assertNever } from '@sofie-prompter-editor/shared-lib'
import { RootAppStore } from '../../stores/RootAppStore.ts'
import { AnyTriggerAction } from './triggerActions.ts'

/**
 * The TriggerActionHandler is responsible for listening to some action events and executing the actions accordingly.
 */
export class TriggerActionHandler {
	private prompterSpeed = 0
	private prompterSpeedUseSaved: number | false = false

	constructor(private store: typeof RootAppStore) {
		this.onAction = this.onAction.bind(this)

		this.store.triggerStore.on('action', this.onAction)
	}

	private onAction(action: AnyTriggerAction) {
		console.log('action', JSON.stringify(action))

		if (action.type === 'prompterSetSpeed') {
			this.prompterSpeed = action.payload.speed
			this.prompterSpeedUseSaved = false
			this.sendPrompterSpeed()
		} else if (action.type === 'prompterAddSpeed') {
			this.prompterSpeed += action.payload.deltaSpeed
			this.prompterSpeedUseSaved = false
			this.sendPrompterSpeed()
		} else if (action.type === 'prompterJump') {
			// TODO
			// this.store.connection.controller.sendMessage({
			// 	speed: 0,
			// 	offset: action.payload.offset,
			// })
		} else if (action.type === 'movePrompterToHere') {
			// Not handled here
		} else if (action.type === 'prompterAddSavedSpeed') {
			const prevSpeed = this.store.outputSettingsStore.outputSettings.savedSpeed ?? 0
			const newSpeed = prevSpeed + action.payload.deltaSpeed
			this.store.connection.outputSettings.patch(null, {
				savedSpeed: newSpeed,
			})
			if (this.prompterSpeedUseSaved) this.sendPrompterSpeed()
		} else if (action.type === 'prompterUseSavedSpeed') {
			this.prompterSpeedUseSaved = action.payload.factor ?? 1
			this.sendPrompterSpeed()
		} else {
			assertNever(action)
		}
	}

	private sendPrompterSpeed() {
		// Send message with speed:

		const savedSpeed = this.store.outputSettingsStore.outputSettings.savedSpeed ?? 0
		// Modify the value according to an attack curve:
		const speed =
			this.prompterSpeedUseSaved === false
				? this.attackCurve(this.prompterSpeed, 5, 0.7)
				: savedSpeed * this.prompterSpeedUseSaved

		this.store.connection.controller.sendMessage({
			speed: speed,
			offset: null,
		})
	}
	destroy(): void {}

	/**
	 * Scales a value which follows a curve which at low values (0-normalValue) is pretty much linear,
	 * but at higher values (normalValue+) grows much faster
	 * @param x The value to scale
	 * @param power The power of the curve
	 * @param normalValue The value up to which at which the curve is mostly linear
	 */
	private attackCurve(x: number, power = 1, normalValue = 1): number {
		const attack = Math.sign(x) * Math.abs(Math.pow(x, power) * Math.pow(1 / normalValue, power))
		const linear = x
		return linear + attack
	}
}
