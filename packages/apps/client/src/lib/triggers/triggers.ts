import { TriggerConfig, TriggerConfigType } from './triggerConfig.ts'

// We might move these to a config file later:
export const hardCodedTriggers: TriggerConfig[] = [
	{
		type: TriggerConfigType.KEYBOARD,
		keys: 'ArrowUp',
		action: {
			type: 'prompterMove',
			payload: {
				speed: -3,
			},
		},
	},
	{
		type: TriggerConfigType.KEYBOARD,
		keys: 'ArrowDown',
		action: {
			type: 'prompterMove',
			payload: {
				speed: 3,
			},
		},
	},
	{
		type: TriggerConfigType.KEYBOARD,
		keys: 'Numpad0',
		action: {
			type: 'prompterMove',
			payload: {
				speed: 0,
			},
		},
	},
	{
		type: TriggerConfigType.XKEYS,
		productId: null,
		unitId: null,
		eventType: 'down',
		index: 1,
		action: {
			type: 'prompterMove',
			payload: {
				speed: -3,
			},
		},
	},
	{
		type: TriggerConfigType.XKEYS,
		productId: null,
		unitId: null,
		eventType: 'down',
		index: 2,
		action: {
			type: 'prompterMove',
			payload: {
				speed: 3,
			},
		},
	},
	{
		type: TriggerConfigType.XKEYS,
		productId: null,
		unitId: null,
		eventType: 'tbar',
		index: 0,
		action: {
			type: 'prompterMove',
		},
	},
	{
		type: TriggerConfigType.XKEYS,
		productId: null,
		unitId: null,
		eventType: 'jog',
		index: 0,
		action: {
			type: 'prompterAccelerate',
		},
	},
	{
		type: TriggerConfigType.XKEYS,
		productId: null,
		unitId: null,
		eventType: 'shuttle',
		index: 0,
		action: {
			type: 'prompterMove',
		},
	},
	{
		type: TriggerConfigType.STREAMDECK,
		modelId: null,
		serialNumber: null,
		eventType: 'down',
		index: 0,
		action: {
			type: 'prompterMove',
			payload: {
				speed: 3,
			},
		},
	},
	{
		type: TriggerConfigType.STREAMDECK,
		modelId: null,
		serialNumber: null,
		eventType: 'rotate',
		index: 0,
		action: {
			type: 'prompterMove',
		},
	},
	{
		type: TriggerConfigType.SPACEMOUSE,
		productId: null,
		unitId: null,
		eventType: 'rotate',
		index: 0,
		action: {
			type: 'prompterMove',
		},
	},
]
