import Sorensen from '@sofie-automation/sorensen'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigKeyboard, TriggerConfigType } from '../triggerConfig'

export class TriggerHandlerKeyboard extends TriggerHandler<TriggerConfigKeyboard> {
	async initialize(triggers?: TriggerConfig[]): Promise<void> {
		if (triggers) this.triggers = triggers

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const theWindow = window as any
		// hot-module-reload fix:
		if (!theWindow.sorensenInitialized) {
			theWindow.sorensenInitialized = true
			await Sorensen.init()
		} else {
			await Sorensen.destroy()
			await Sorensen.init()
		}

		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.KEYBOARD) continue

			this.triggerKeys.push(trigger)

			Sorensen.bind(
				trigger.keys,
				() => {
					const action = this.getKeyAction((t) => t === trigger)
					if (action) this.emit('action', action)
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
