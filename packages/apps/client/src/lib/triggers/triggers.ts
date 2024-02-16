import { TriggerConfig, TriggerConfigType } from './triggerConfig.ts'

// We might move these to a config file later:
export const hardCodedTriggers: TriggerConfig[] = [
	{
		type: TriggerConfigType.KEYBOARD,
		keys: 'F4',
		action: {
			type: 'prompterAddSpeed',
			payload: {
				deltaSpeed: -0.3,
			},
		},
	},
	{
		type: TriggerConfigType.KEYBOARD,
		keys: 'F5',
		action: {
			type: 'prompterSetSpeed',
			payload: {
				speed: 0,
			},
		},
	},
	{
		type: TriggerConfigType.KEYBOARD,
		keys: 'F6',
		action: {
			type: 'prompterAddSpeed',
			payload: {
				deltaSpeed: 0.3,
			},
		},
	},

	{
		type: TriggerConfigType.KEYBOARD,
		keys: 'F9',
		action: {
			type: 'movePrompterToHere',
			payload: {},
		},
	},

	{
		type: TriggerConfigType.XKEYS,
		productId: null,
		unitId: null,
		eventType: 'down',
		index: 1,
		action: {
			type: 'prompterSetSpeed',
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
			type: 'prompterSetSpeed',
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
			type: 'prompterSetSpeed',
		},
	},
	{
		type: TriggerConfigType.XKEYS,
		productId: null,
		unitId: null,
		eventType: 'jog',
		index: 0,
		action: {
			type: 'prompterAddSpeed',
		},
	},
	{
		type: TriggerConfigType.XKEYS,
		productId: null,
		unitId: null,
		eventType: 'shuttle',
		index: 0,
		action: {
			type: 'prompterSetSpeed',
		},
	},
	{
		type: TriggerConfigType.STREAMDECK,
		modelId: null,
		serialNumber: null,
		eventType: 'down',
		index: 0,
		action: {
			type: 'prompterSetSpeed',
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
			type: 'prompterSetSpeed',
		},
	},
	{
		type: TriggerConfigType.SPACEMOUSE,
		productId: null,
		eventType: 'rotate',
		index: 0,
		action: {
			type: 'prompterSetSpeed',
		},
	},
	{
		type: TriggerConfigType.JOYCON,
		eventType: 'stick',
		index: 0,
		action: {
			type: 'prompterSetSpeed',
		},
	},
	{
		type: TriggerConfigType.JOYCON,
		eventType: 'down',
		index: 3, // right key
		action: {
			type: 'movePrompterToHere',
			payload: {},
		},
	},

	{
		type: TriggerConfigType.JOYCON,
		eventType: 'down',
		index: 2, // up key
		action: {
			type: 'prompterSetSpeed',
			payload: {
				speed: -1.1,
			},
		},
	},
	{
		type: TriggerConfigType.JOYCON,
		eventType: 'up',
		index: 2, // up key
		action: {
			type: 'prompterSetSpeed',
			payload: {
				speed: 0,
			},
		},
	},
	{
		type: TriggerConfigType.JOYCON,
		eventType: 'down',
		index: 1, // down key
		action: {
			type: 'prompterSetSpeed',
			payload: {
				speed: 1.1,
			},
		},
	},
	{
		type: TriggerConfigType.JOYCON,
		eventType: 'up',
		index: 1, // down key
		action: {
			type: 'prompterSetSpeed',
			payload: {
				speed: 0,
			},
		},
	},
	{
		type: TriggerConfigType.MIDI,
		eventType: 'analog',
		// name: 'x-touch mini',
		name: null,
		channel: null,
		index: null,
		action: {
			type: 'prompterSetSpeed',
		},
	},
]
