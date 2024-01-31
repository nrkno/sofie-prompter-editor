import { BindOptions } from '@sofie-automation/sorensen'
import { AnyTriggerAction } from '../triggerActions/triggerActions.ts'
import { DeviceModelId } from '@elgato-stream-deck/webhid'

export type TriggerConfig =
	| TriggerConfigKeyboard
	| TriggerConfigXkeys
	| TriggerConfigStreamdeck
	| TriggerConfigSpacemouse

export enum TriggerConfigType {
	KEYBOARD = 'keyboard',
	XKEYS = 'xkeys',
	STREAMDECK = 'streamdeck',
	SPACEMOUSE = 'spacemouse',
}
export interface TriggerConfigBase {
	type: TriggerConfigType
}
export interface TriggerConfigKeyboard extends TriggerConfigBase {
	type: TriggerConfigType.KEYBOARD

	action: AnyTriggerAction
	/**
	 * a "+" and space concatenated list of KeyboardEvent.key key values (see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values),
	 * in order (order not significant for modifier keys), f.g. "Control+Shift+KeyA", "Control+Shift+KeyB KeyU".
	 * "Control" means "either ControlLeft or ControlRight", same for "Shift" and "Alt"
	 * Spaces indicate chord sequences.
	 */
	keys: string

	/**
	 * If enabled, actions will happen on keyUp, as opposed to keyDown
	 *
	 * @type {boolean}
	 * @memberof IBlueprintHotkeyTrigger
	 */
	up?: boolean

	global?: BindOptions['global']
}
export interface TriggerConfigXkeys extends TriggerConfigBase {
	type: TriggerConfigType.XKEYS

	/** userId of the xkeys panel, or null to match any */
	productId: number | null
	/** userId of the xkeys, or null to match any */
	unitId: number | null

	eventType: 'down' | 'up' | 'jog' | 'joystick' | 'rotary' | 'shuttle' | 'tbar' | 'trackball'
	/** Index of the key, joystick, etc */
	index: number

	/** If action.payload is not set, use value from the xkeys */
	action:
		| AnyTriggerAction
		| {
				type: AnyTriggerAction['type']
				// no payload, use value from the xkeys
		  }
}
export interface TriggerConfigStreamdeck extends TriggerConfigBase {
	type: TriggerConfigType.STREAMDECK

	/** userId of the Streamdeck, or null to match any */
	modelId: DeviceModelId | null
	/** userId of the Streamdeck, or null to match any */
	serialNumber: string | null

	eventType: 'down' | 'up' | 'rotate' | 'encoderDown' | 'encoderUp'
	/** Index of the key, knob, etc */
	index: number

	/** If action.payload is not set, use value from the xkeys */
	action:
		| AnyTriggerAction
		| {
				type: AnyTriggerAction['type']
				// no payload, use value from the streamdeck
		  }
}

export interface TriggerConfigSpacemouse extends TriggerConfigBase {
	type: TriggerConfigType.SPACEMOUSE

	/** userId of the xkeys panel, or null to match any */
	productId: number | null
	/** userId of the xkeys, or null to match any */
	unitId: number | null

	eventType: 'down' | 'up' | 'rotate' | 'translate'
	/** Index of the key, if needed, 0 otherwise */
	index: number

	/** If action.payload is not set, use value from the xkeys */
	action:
		| AnyTriggerAction
		| {
				type: AnyTriggerAction['type']
				// no payload, use value from the xkeys
		  }
}
