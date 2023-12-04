import { makeAutoObservable, action } from 'mobx'
import { RundownStore } from './RundownStore'
import { MockConnection } from '../mocks/mockConnection'
import { UIStore } from './UIStore'

class AppStoreClass {
	connected = false
	rundownStore: RundownStore
	uiStore: UIStore
	connection = new MockConnection()

	constructor() {
		makeAutoObservable(this)
		this.rundownStore = new RundownStore(this, this.connection)
		this.uiStore = new UIStore()

		this.connection.on(
			'connected',
			action('setConnected', () => {
				this.connected = true
			})
		)

		this.connection.on(
			'disconnected',
			action('setDisconnected', () => {
				this.connected = false
			})
		)
	}
}

export const AppStore = new AppStoreClass()

export type APIConnection = MockConnection
