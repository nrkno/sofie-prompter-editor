import { assertNever } from '@sofie-prompter-editor/shared-lib'
import { RootAppStore } from '../../stores/RootAppStore.ts'
import { AnyTriggerAction } from './triggerActions.ts'

/**
 * The TriggerActionHandler is responsible for listening to some action events and executing the actions accordingly.
 */
export class TriggerActionHandler {
	private prompterSpeed = 0

	constructor(private store: typeof RootAppStore) {
		this.onAction = this.onAction.bind(this)

		this.store.triggerStore.on('action', this.onAction)
	}

	private onAction(action: AnyTriggerAction) {
		console.log('action', JSON.stringify(action))

		if (action.type === 'prompterMove') {
			this.prompterSpeed = action.payload.speed
			this.sendPrompterSpeed()
		} else if (action.type === 'prompterAccelerate') {
			this.prompterSpeed += action.payload.accelerate
			this.sendPrompterSpeed()
		} else if (action.type === 'prompterJump') {
			// TODO
			// this.store.connection.controller.sendMessage({
			// 	speed: 0,
			// 	offset: action.payload.offset,
			// })
		} else if (action.type === 'movePrompterToHere') {
			// Not handled here
		} else {
			assertNever(action)
		}
	}

	private sendPrompterSpeed() {
		// Send message with speed:

		// Modify the value so that
		const speed = this.attackCurve(this.prompterSpeed, 10, 0.7)

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