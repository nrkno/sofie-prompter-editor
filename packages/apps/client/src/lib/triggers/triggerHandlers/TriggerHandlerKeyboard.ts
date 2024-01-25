import Sorensen from '@sofie-automation/sorensen'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigType } from '../triggerConfig'

export class TriggerHandlerKeyboard extends TriggerHandler {
	async initialize(triggers?: TriggerConfig[]): Promise<void> {
		if (triggers) this.triggers = triggers
		// hot-module-reload fix:
		if (!(window as any).sorensenInitialized) {
			;(window as any).sorensenInitialized = true
			await Sorensen.init()
		} else {
			await Sorensen.destroy()
			await Sorensen.init()
		}

		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.KEYBOARD) continue

			Sorensen.bind(
				trigger.keys,
				() => {
					this.emit('action', trigger.action)
				},
				{
					up: trigger.up,
					global: trigger.global,

					exclusive: true,
					ordered: 'modifiersFirst',
					preventDefaultPartials: false,
					preventDefaultDown: true,
				}
			)
		}
	}
	async destroy(): Promise<void> {
		Sorensen.destroy().catch((e: Error) => console.error('Sorensen.destroy', e))
	}
}
