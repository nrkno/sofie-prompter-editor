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
		this.loadInitialData()
	}

	private setupSubscription = action(() => {
		this.reactions.push(this.appStore.whenConnected(() => this.connection.viewPort.subscribeToViewPort()))

		this.connection.viewPort.on('updated', this.onUpdatedViewPort)
	})
	private loadInitialData = flow(function* (this: ViewPortStore) {
		const outputSettings = yield this.connection.viewPort.get(null)
		this.onUpdatedViewPort(outputSettings)

		this.initialized = true
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
