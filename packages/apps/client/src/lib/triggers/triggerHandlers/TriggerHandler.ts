import { EventEmitter } from 'eventemitter3'
import { AnyTriggerAction } from '../../triggerActions/triggerActions.ts'
import { TriggerConfig } from '../triggerConfig.ts'

export interface TriggerHandlerEvents {
	action: [action: AnyTriggerAction]

	/** A message indicating that we want to ask the user if we should request access to the HIDDevice */
	requestHIDDeviceAccess: [deviceName: string, callback: (access: boolean) => void]
}

export abstract class TriggerHandler extends EventEmitter<TriggerHandlerEvents> {
	protected triggers: TriggerConfig[] = []
	abstract initialize(triggers?: TriggerConfig[]): Promise<void>
	abstract destroy(): Promise<void>
}
