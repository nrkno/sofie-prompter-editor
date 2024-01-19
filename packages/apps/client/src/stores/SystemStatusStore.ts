import { observable, action, flow, makeObservable, IReactionDisposer, reaction } from 'mobx'
import { SystemStatus } from '@sofie-prompter-editor/shared-model'
import { APIConnection, RootAppStore } from './RootAppStore.ts'

export class SystemStatusStore {
	/** Is set to true after the initial loading of data has completed */
	initialized = false
	/** Whether the connection to the backend API is   */
	connectedToApi = false

	systemStatus = observable.object<SystemStatus>({
		statusMessage: null,
		connectedToCore: false,
	})

	private reactions: IReactionDisposer[] = []

	constructor(public appStore: typeof RootAppStore, public connection: APIConnection) {
		makeObservable(this, {
			initialized: observable,
			connectedToApi: observable,
		})
		this.setupSubscription()
		this.loadInitialData()
	}

	private setupSubscription = action(() => {
		this.reactions.push(
			reaction(
				() => this.appStore.connected,
				async (connected) => {
					if (connected) {
						this.connectedToApi = true

						await this.connection.systemStatus.subscribe()
					} else {
						this.connectedToApi = false
					}
				},
				{
					fireImmediately: true,
				}
			)
		)

		this.connection.systemStatus.on('updated', this.onUpdatedSystemStatus)
	})
	private loadInitialData = flow(function* (this: SystemStatusStore) {
		const systemStatus = yield this.connection.systemStatus.get(null)
		this.onUpdatedSystemStatus(systemStatus)
		this.initialized = true
	})

	private onUpdatedSystemStatus = action('onUpdatedOutputSettings', (newData: SystemStatus) => {
		for (const [key, value] of Object.entries(newData)) {
			// @ts-expect-error hack
			this.systemStatus[key] = value
		}
	})

	destroy = () => {
		this.reactions.forEach((dispose) => dispose())
	}
}
