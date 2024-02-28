/* eslint-disable no-mixed-spaces-and-tabs */

import { ControllerMessage } from '@sofie-prompter-editor/shared-model'

export type AnyTriggerAction =
	// "Set the prompter speed to the speed value"
	| TriggerAction<
			'prompterSetSpeed',
			{
				/** The speed to move the prompter */
				speed: number
			}
	  >
	// "Adjust the prompter speed, by adding the deltaSpeed to it"
	| TriggerAction<
			'prompterAddSpeed',
			{
				/** Change the speed by this amount */
				deltaSpeed: number
			}
	  >
	// "Jump the prompter to the offset"
	| TriggerAction<
			'prompterJump',
			{
				offset: ControllerMessage['offset']
			}
	  >
	// "Jump the prompter by the offset"
	| TriggerAction<
			'prompterJumpBy',
			{
				offset: number
			}
	  >
	// "Jump the prompter by the offset"
	| TriggerAction<
			'jumpByEntity',
			{
				type: 'rundown' | 'segment' | 'line' | null
				deltaIndex: number
			}
	  >
	// "Jump the prompter by the offset"
	| TriggerAction<
			'jumpTo',
			{
				type: 'onAir' | 'next'
			}
	  >
	// "Make the prompter jump to the currently selected Part"
	| TriggerAction<
			'movePrompterToHere',
			{
				// nothing
			}
	  >
	// "Adjust the prompter saved speed, by adding the deltaSpeed to it"
	| TriggerAction<
			'prompterAddSavedSpeed',
			{
				/** Change the speed by this amount */
				deltaSpeed: number
			}
	  >
	// "Set the prompter speed to the saved speed value (multiplied by factor)"
	| TriggerAction<
			'prompterUseSavedSpeed',
			{
				factor: number
			}
	  >

type TriggerAction<Type extends string, Payload extends Record<string, unknown>> = {
	type: Type
	payload: Payload
}
