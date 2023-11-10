import { makeAutoObservable, action } from 'mobx'
import { RundownStore } from './RundownStore'
import { APIConnection } from '../api/ApiConnection'

export class AppStore {
	connected = false
	rundownStore: RundownStore
	connection = new APIConnection()

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
