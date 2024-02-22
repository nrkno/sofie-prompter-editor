import { IReactionDisposer, action, makeObservable, observable, reaction } from 'mobx'
import { APIConnection } from './RootAppStore.js'
import { APIConnection as APIConnectionImpl } from '../api/ApiConnection.js'

export class OutputStore {
	reactions: IReactionDisposer[] = []
	connection: APIConnection
	connected = false

	constructor() {
		makeObservable(this, {
			connected: observable,
		})

		const apiConnection = new APIConnectionImpl()
		this.connection = apiConnection
		this.connection.on('disconnected', this.onDisconnected)

		this.connection.on('connected', this.onConnected)
	}

	onConnected = action('onConnected', () => {
		this.connected = true
	})

	onDisconnected = action('onDisconnected', () => {
		this.connected = false
	})
}
