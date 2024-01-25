import { EventEmitter } from 'eventemitter3'
import { AnyTriggerAction } from '../triggerActions'
import { TriggerConfig } from '../triggerConfig.ts'

export interface TriggerHandlerEvents {
	action: [action: AnyTriggerAction]

	requestXkeysAccess: []
	requestStreamdeckAccess: []
	requestSpacemouseAccess: []
}

export abstract class TriggerHandler extends EventEmitter<TriggerHandlerEvents> {
	protected triggers: TriggerConfig[] = []
	abstract initialize(triggers?: TriggerConfig[]): Promise<void>
	abstract destroy(): Promise<void>
}
