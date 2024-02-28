import { EventEmitter } from 'eventemitter3'
import { AnyTriggerAction } from '../../triggerActions/triggerActions.ts'
import { TriggerConfig, TriggerConfigBase } from '../triggerConfig.ts'
import { assertNever } from '@sofie-prompter-editor/shared-lib'

export interface TriggerHandlerEvents {
	action: [action: AnyTriggerAction]

	/** A message indicating that we want to ask the user if we should request access to the HIDDevice */
	requestHIDDeviceAccess: [deviceName: string, callback: (access: boolean) => void]
}

export abstract class TriggerHandler<Trigger extends TriggerConfigBase> extends EventEmitter<TriggerHandlerEvents> {
	protected triggers: TriggerConfig[] = []
	abstract initialize(triggers?: TriggerConfig[]): Promise<void>
	abstract destroy(): Promise<void>
	abstract onPrompterState(state: PrompterState): void

	protected triggerKeys: Trigger[] = []
	protected triggerAnalog: Trigger[] = []
	protected triggerXYZ: Trigger[] = []

	/** Generate an action from a key input */
	protected getKeyAction(filterTrigger: (trigger: Trigger) => boolean): AnyTriggerAction | undefined {
		const trigger: Trigger | undefined = this.triggerKeys.find(filterTrigger)
		if (!trigger) return undefined
		if ('payload' in trigger.action) return trigger.action // Already defined, just pass through

		return undefined
	}
	/** Generate an action from a "analog type" input */
	protected getAnalogAction(
		filterTrigger: (trigger: Trigger) => boolean,
		value: number,
		options: {
			scaleMaxValue?: number
			zeroValue?: number
			invert?: boolean
		}
	): AnyTriggerAction | undefined {
		const trigger: Trigger | undefined = this.triggerAnalog.find(filterTrigger)
		if (!trigger) return undefined
		if ('payload' in trigger.action) return trigger.action // Already defined, just pass through

		const scaleMaxValue = options?.scaleMaxValue ?? 1
		const zeroValue = options?.zeroValue ?? 0
		const invert = options?.invert ?? 0

		const scale = trigger.modifier?.scale ?? 1

		const normalValue = ((value - zeroValue) / scaleMaxValue) * (invert ? -1 : 1) * scale

		if (trigger.action.type === 'prompterSetSpeed') {
			return {
				type: trigger.action.type,
				payload: { speed: normalValue },
			}
		} else if (trigger.action.type === 'prompterAddSpeed' || trigger.action.type === 'prompterAddSavedSpeed') {
			return {
				type: trigger.action.type,
				payload: { deltaSpeed: normalValue },
			}
		} else if (trigger.action.type === 'prompterJumpBy') {
			return {
				type: trigger.action.type,
				payload: { offset: normalValue },
			}
		} else if (
			trigger.action.type === 'jumpByEntity' ||
			trigger.action.type === 'jumpTo' ||
			trigger.action.type === 'prompterJump' ||
			trigger.action.type === 'prompterUseSavedSpeed' ||
			trigger.action.type === 'movePrompterToHere'
		) {
			// not supported, ignore
		} else {
			assertNever(trigger.action.type)
		}
		return undefined
	}
	/** Generate an action from a "XYZ type" input */
	protected getXYZAction(
		filterTrigger: (trigger: Trigger) => boolean,
		_xyz: { x: number; y: number; z?: number },
		/** calculated from xyz */
		resultingValue: number,
		options: {
			scaleMaxValue?: number
			zeroValue?: number
			invert?: boolean
		}
	): AnyTriggerAction | undefined {
		const trigger: Trigger | undefined = this.triggerXYZ.find(filterTrigger)
		if (!trigger) return undefined
		if ('payload' in trigger.action) return trigger.action // Already defined, just pass through

		const scaleMaxValue = options?.scaleMaxValue ?? 1
		const zeroValue = options?.zeroValue ?? 0
		const invert = options?.invert ?? 0

		const scale = trigger.modifier?.scale ?? 1

		const normalValue = ((resultingValue - zeroValue) / scaleMaxValue) * (invert ? -1 : 1) * scale

		if (trigger.action.type === 'prompterSetSpeed') {
			return {
				type: 'prompterSetSpeed',
				payload: { speed: normalValue },
			}
		} else if (trigger.action.type === 'prompterAddSpeed' || trigger.action.type === 'prompterAddSavedSpeed') {
			return {
				type: 'prompterAddSpeed',
				payload: { deltaSpeed: normalValue },
			}
		} else if (
			trigger.action.type === 'jumpByEntity' ||
			trigger.action.type === 'jumpTo' ||
			trigger.action.type === 'prompterJumpBy' ||
			trigger.action.type === 'prompterJump' ||
			trigger.action.type === 'prompterUseSavedSpeed' ||
			trigger.action.type === 'movePrompterToHere'
		) {
			// not supported, ignore
		} else {
			assertNever(trigger.action.type)
		}
		return undefined
	}
}
export interface PrompterState {
	isPrompterMoving: boolean
	// isPrompterAtTop: boolean // TODO
	// isPrompterAtBottom: boolean // TODO
}
