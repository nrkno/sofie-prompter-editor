/* eslint-disable no-mixed-spaces-and-tabs */

export type AnyTriggerAction =
	| TriggerAction<
			'prompterMove',
			{
				/** The speed to move the prompter */
				speed: number
			}
	  >
	| TriggerAction<
			'prompterJump',
			{
				// todo
			}
	  >
	| TriggerAction<'movePrompterToHere', {}>

type TriggerAction<Type extends string, Payload extends Record<string, any>> = {
	type: Type
	payload: Payload
}
