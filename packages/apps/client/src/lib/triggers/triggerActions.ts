/* eslint-disable no-mixed-spaces-and-tabs */

export type TriggerAction =
	| {
			type: 'prompterMove'
			/** The speed to move the prompter */
			speed: number
	  }
	| {
			type: 'prompterJump'
			// todo
	  }
