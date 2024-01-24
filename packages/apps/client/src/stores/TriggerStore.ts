import { observable, action, flow, makeObservable, IReactionDisposer, reaction } from 'mobx'
import Sorensen from '@sofie-automation/sorensen'
import { OutputSettings } from '@sofie-prompter-editor/shared-model'
import { APIConnection, RootAppStore } from './RootAppStore.ts'
import { triggers } from '../lib/triggers/triggers.ts'
import { TriggerConfigType } from '../lib/triggers/triggerConfig.ts'

/**
 * The TriggerStore is responsible for listening to triggers (eg keyboard shortcuts) and dispatching action events
 */
export class TriggerStore {
	// initialized = false
	// private initializing = false

	reactions: IReactionDisposer[] = []
	listeners: {
		actionListener: () => void
	}[] = []

	private sorensen = Sorensen

	private triggers = triggers

	constructor(public appStore: typeof RootAppStore, public connection: APIConnection) {
		makeObservable(this, {
			// outputSettings: observable,
			// initialized: observable,
		})

		this.initialize().catch(console.error)
	}

	public async initialize() {
		// if (!this.initializing && !this.initialized) {
		// 	this.initializing = true
		// 	this.setupSubscription()
		// 	this.loadInitialData()
		// }
	}

	public async setupKeyboard() {
		await Sorensen.init()

		for (const trigger of triggers) {
			if (trigger.type !== TriggerConfigType.KEYBOARD) continue

			const actionListener = () => {}

			this.sorensen.bind(trigger.keys, actionListener, {
				up: trigger.up,
				exclusive: true,
				ordered: 'modifiersFirst',
				preventDefaultPartials: false,
				preventDefaultDown: true,
				global: trigger.global,
			})

			this.listeners.push({
				actionListener,
			})
		}

		// sorensen.bind('Shift', onKey, {
		// 	up: false,
		// 	global: true,
		// })
		// this.sorensen.bind(Settings.confirmKeyCode, this.preventDefault, {
		// 	up: false,
		// 	prepend: true,
		// })
		// this.sorensen.bind(Settings.confirmKeyCode, this.handleKey, {
		// 	up: true,
		// 	prepend: true,
		// })
	}
	public async setupXKeys() {}

	destroy = () => {
		this.reactions.forEach((dispose) => dispose())
		this.sorensen.destroy().catch((e: Error) => console.error('Sorensen.destroy', e))
	}
}
