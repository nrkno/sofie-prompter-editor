import { makeAutoObservable, action } from 'mobx'
import { RundownStore } from './RundownStore'
import { MockConnection } from '../mocks/mockConnection'
import { UIStore } from './UIStore'
import { APIConnection as APIConnectionImpl } from '../api/ApiConnection.ts'
class AppStoreClass {
	connected = false
	rundownStore: RundownStore
	uiStore: UIStore

	constructor(public connection: APIConnection) {
		makeAutoObservable(this)

		this.rundownStore = new RundownStore(this, connection)
		this.uiStore = new UIStore()

		connection.on(
			'connected',
			action('setConnected', () => {
				this.connected = true
			})
		)

		connection.on(
			'disconnected',
			action('setDisconnected', () => {
				this.connected = false
			})
		)
	}
}
export const apiConnection = new APIConnectionImpl()

export const AppStore = new AppStoreClass(apiConnection)

export type APIConnection = APIConnectionImpl
