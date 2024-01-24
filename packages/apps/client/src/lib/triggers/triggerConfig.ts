import {BindOptions} from '@sofie-automation/sorensen'
import { TriggerAction } from './triggerActions.ts'



export type TriggerConfig = TriggerConfigKeyboard | TriggerConfigXkeys

export enum TriggerConfigType {
	KEYBOARD = 'keyboard',
	XKEYS = 'xkeys',
}
export interface TriggerConfigBase {
	type: TriggerConfigType

	action: TriggerAction
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

	// Todo
}
