/* eslint-disable no-mixed-spaces-and-tabs */

import { ControllerMessage } from '@sofie-prompter-editor/shared-model'

export type AnyTriggerAction =
	| TriggerAction<
			'prompterMove',
			{
				/** The speed to move the prompter */
				speed: number
			}
	  >
	| TriggerAction<
			'prompterAccelerate',
			{
				/** The acceleration move the prompter */
				accelerate: number
			}
	  >
	| TriggerAction<
			'prompterJump',
			{
				offset: ControllerMessage['offset']
			}
	  >
	| TriggerAction<
			'movePrompterToHere',
			{
				// nothing
			}
	  >

type TriggerAction<Type extends string, Payload extends Record<string, unknown>> = {
	type: Type
	payload: Payload
}
