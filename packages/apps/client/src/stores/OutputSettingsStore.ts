import { observable, action, flow, makeObservable, IReactionDisposer, reaction } from 'mobx'
import { OutputSettings } from '@sofie-prompter-editor/shared-model'
import { APIConnection, RootAppStore } from './RootAppStore.ts'

export class OutputSettingsStore {
	outputSettings = observable.object<OutputSettings>({
		fontSize: 0,
		mirrorHorizontally: false,
		mirrorVertically: false,
		focusPosition: 'start',
		showFocusPosition: false,
		marginHorizontal: 0,
		marginVertical: 0,
		activeRundownPlaylistId: null,
		savedSpeed: 0,
	})

	initialized = false
	private initializing = false

	reactions: IReactionDisposer[] = []

	constructor(public appStore: typeof RootAppStore, public connection: APIConnection) {
		makeObservable(this, {
			outputSettings: observable,
			initialized: observable,
		})

		// Note: we DON'T initialize here,
		// instead, when anyone wants to use this store, they should call initialize() first.
	}

	public initialize() {
		if (this.initializing || this.initialized) return
		this.initializing = true

		this.setupSubscription()
	}

	private setupSubscription = action(() => {
		this.reactions.push(
			this.appStore.whenConnected(async () => {
				// Setup subscription and load initial data:
				const initialData = await this.connection.outputSettings.subscribe()
				this.onUpdatedOutputSettings(initialData)

				this.initialized = true
			})
		)

		this.connection.outputSettings.on('updated', this.onUpdatedOutputSettings)
	})

	private onUpdatedOutputSettings = action('onUpdatedOutputSettings', (newData: OutputSettings) => {
		for (const [key, value] of Object.entries(newData)) {
			// @ts-expect-error hack
			this.outputSettings[key] = value
		}
	})

	destroy = () => {
		this.reactions.forEach((dispose) => dispose())
	}
}
