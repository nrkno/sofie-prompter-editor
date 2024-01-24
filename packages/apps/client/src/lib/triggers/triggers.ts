import { TriggerConfig, TriggerConfigType } from './triggerConfig.ts'

export const triggers: TriggerConfig[] = [
	{
		type: TriggerConfigType.KEYBOARD,
		keys: 'ArrowUp',
		action: {
			type: 'prompterMove',
			speed: -3,
		},
	},
	{
		type: TriggerConfigType.KEYBOARD,
		keys: 'ArrowDown',
		action: {
			type: 'prompterMove',
			speed: 3,
		},
	},
]
