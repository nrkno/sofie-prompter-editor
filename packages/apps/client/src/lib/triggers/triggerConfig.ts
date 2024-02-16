/* eslint-disable no-mixed-spaces-and-tabs */
import { BindOptions } from '@sofie-automation/sorensen'
import { AnyTriggerAction } from '../triggerActions/triggerActions.ts'
import { DeviceModelId } from '@elgato-stream-deck/webhid'

export type TriggerConfig =
	| TriggerConfigKeyboard
	| TriggerConfigXkeys
	| TriggerConfigStreamdeck
	| TriggerConfigSpacemouse
	| TriggerConfigJoycon
	| TriggerConfigMidi

export enum TriggerConfigType {
	KEYBOARD = 'keyboard',
	XKEYS = 'xkeys',
	STREAMDECK = 'streamdeck',
	SPACEMOUSE = 'spacemouse',
	JOYCON = 'joycon',
	MIDI = 'midi',
}
export interface TriggerConfigBase {
	type: TriggerConfigType

	/** If action.payload is not set, use value from the input */
	action:
		| AnyTriggerAction
		| {
				type: AnyTriggerAction['type']
				// no payload, use value from the input
		  }

	modifier?: {
		/** (if applicable) Scale the analog value */
		scale?: number
	}
}
export interface TriggerConfigKeyboard extends TriggerConfigBase {
	type: TriggerConfigType.KEYBOARD

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
}

export interface TriggerConfigSpacemouse extends TriggerConfigBase {
	type: TriggerConfigType.SPACEMOUSE

	/** userId of the spacemouse device, or null to match any */
	productId: number | null

	eventType: 'down' | 'up' | 'rotate' | 'translate'
	/** Index of the key, if needed, 0 otherwise */
	index: number
}
export interface TriggerConfigJoycon extends TriggerConfigBase {
	type: TriggerConfigType.JOYCON

	eventType: 'up' | 'down' | 'stick'
	/** what key, '' for the joystick */
	button: 'left' | 'down' | 'up' | 'right' | 'LR' | 'Z' | 'home' | 'sign' | 'stickpress' | ''
}

export interface TriggerConfigMidi extends TriggerConfigBase {
	type: TriggerConfigType.MIDI

	/** If set, match any midi devices with that name (case insensitive), null to match any*/
	name: string | null

	eventType: 'down' | 'up' | 'analog'
	/** Index of the channel, or null to match any */
	channel: number | null
	/** Index of the key / control, or null to match any */
	index: number | null
}
