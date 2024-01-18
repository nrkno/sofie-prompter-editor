import { observable, action, flow, makeObservable, IReactionDisposer, reaction } from 'mobx'
import { OutputSettings } from '@sofie-prompter-editor/shared-model'
import { APIConnection, AppStore } from './AppStore'

export class OutputSettingsStore {
	// showingOnlyScripts = false

	// allRundowns = observable.map<RundownPlaylistId, UIRundownEntry>()
	// openRundown: UIRundown | null = null

	outputSettings: OutputSettings | null = null // observable.ref<OutputSettings | null>({})

	initialized = false
	private initializing = false

	reactions: IReactionDisposer[] = []

	constructor(public appStore: typeof AppStore, public connection: APIConnection) {
		makeObservable(this, {
			outputSettings: observable,
			initialized: observable,
			// openRundown: observable,
			// showingOnlyScripts: observable,
		})

		// Note: we DON'T initialize here,
		// instead, when anyone wants to use this store, they should call initialize() first.
	}

	public initialize() {
		if (!this.initializing && !this.initialized) {
			this.initializing = true

			this.setupSubscription()
			this.loadInitialData()
		}
	}

	private setupSubscription = action(() => {
		this.reactions.push(
			reaction(
				() => this.appStore.connected,
				async (connected) => {
					if (!connected) return

					console.log('subscribing!')
					await this.connection.outputSettings.subscribe()
				},
				{
					fireImmediately: true,
				}
			)
		)

		this.connection.outputSettings.on('updated', this.onUpdatedOutputSettings)
		// Note: updated and removed events are handled by the UIRundownEntry's themselves
	})
	private loadInitialData = flow(function* (this: OutputSettingsStore) {
		const outputSettings = yield this.connection.outputSettings.get(null)
		this.onUpdatedOutputSettings(outputSettings)

		this.initialized = true
	})

	private onUpdatedOutputSettings = action('onUpdatedOutputSettings', (newData: OutputSettings) => {
		this.outputSettings = newData
		// for (const key in newData) {
		// 	// @ts-expect-error hack?
		// 	// this.outputSettings[key] = newData[key]
		// }
	})

	destroy = () => {
		this.reactions.forEach((dispose) => dispose())
	}
}
