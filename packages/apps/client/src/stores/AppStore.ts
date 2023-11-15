import { makeAutoObservable, action } from 'mobx'
import { RundownStore } from './RundownStore'
import { MockConnection } from '../mocks/mockConnection'

class AppStoreClass {
	connected = false
	rundownStore: RundownStore
	connection = new MockConnection()

	constructor() {
		makeAutoObservable(this)
		this.rundownStore = new RundownStore(this, this.connection)

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
