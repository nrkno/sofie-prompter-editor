import { observable, action, flow, makeObservable, IReactionDisposer, reaction, toJS } from 'mobx'
import { ViewPort, ViewPortLastKnownState } from '@sofie-prompter-editor/shared-model'
import { APIConnection, RootAppStore } from './RootAppStore.ts'

export class ViewPortStore {
	viewPort = observable.object<ViewPort>({
		_id: '',
		aspectRatio: 1,
		lastKnownState: null,
	})

	initialized = false
	private initializing = false

	reactions: IReactionDisposer[] = []

	constructor(public appStore: typeof RootAppStore, public connection: APIConnection) {
		makeObservable(this, {
			viewPort: observable,
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
				// On connected / reconnected

				// Setup subscription and load initial data:
				const outputSettings = await this.connection.viewPort.subscribeToViewPort()
				this.onUpdatedViewPort(outputSettings)

				this.initialized = true
			})
		)

		this.connection.viewPort.on('updated', this.onUpdatedViewPort)
	})

	private onUpdatedViewPort = action('onUpdatedViewPort', (newData: ViewPort) => {
		for (const [key, value] of Object.entries(newData)) {
			// @ts-expect-error hack
			this.viewPort[key] = value
		}
	})

	update = action('update', (aspectRatio: number, state: ViewPortLastKnownState) => {
		console.log('Sending updated known state', toJS(state))
		this.connection.viewPort.update(null, {
			_id: '',
			aspectRatio,
			lastKnownState: toJS(state),
		})
	})

	destroy = () => {
		this.reactions.forEach((dispose) => dispose())
	}
}
