import io from 'socket.io-client'
import { feathers, Application } from '@feathersjs/feathers'
import socketio, { SocketService } from '@feathersjs/socketio-client'
import { EventEmitter } from 'eventemitter3'
import { ClientMethods, ServiceTypes, Services } from '@sofie-prompter-editor/shared-model'

interface APIConnectionEvents {
	connected: []
	disconnected: []
}
export class APIConnection extends EventEmitter<APIConnectionEvents> {
	private app: Application<AddTypeToProperties<ServiceTypes, SocketService>, unknown>
	constructor() {
		super()
		console.log('setupAPIConnection')

		const socket = io('127.0.0.1:5500') // TODO: port
		socket.on('connect', () => this.emit('connected'))
		socket.on('disconnect', () => this.emit('disconnected'))

		const socketClient = socketio(socket)

		this.app = feathers<AddTypeToProperties<ServiceTypes, SocketService>>()
		this.app.configure(socketClient)

		this.app.use(
			Services.Playlist,
			socketClient.service(Services.Playlist) as SocketService & ServiceTypes[Services.Playlist],
			{
				methods: ClientMethods[Services.Playlist],
			}
		)
	}
}
type AddTypeToProperties<T, U> = {
	[K in keyof T]: U & T[K]
}
