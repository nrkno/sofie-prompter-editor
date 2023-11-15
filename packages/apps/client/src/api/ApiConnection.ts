import io from 'socket.io-client'
import { EventEmitter } from 'eventemitter3'
import { feathers, Application } from '@feathersjs/feathers'
import socketio, { SocketService } from '@feathersjs/socketio-client'
import {
	ExampleServiceDefinition,
	PlaylistServiceDefinition,
	ServiceTypes,
	Services,
} from '@sofie-prompter-editor/shared-model'
import { DEFAULT_DEV_API_PORT } from '@sofie-prompter-editor/shared-lib'
import { AddTypeToProperties, FeathersTypedService } from './lib.ts'

interface APIConnectionEvents {
	connected: []
	disconnected: []
}

export class APIConnection extends EventEmitter<APIConnectionEvents> {
	private app: Application<AddTypeToProperties<ServiceTypes, SocketService>, unknown>

	public readonly playlist: FeathersTypedService<PlaylistServiceDefinition.Service>
	public readonly example: FeathersTypedService<ExampleServiceDefinition.Service>
	public connected = false
	constructor() {
		super()
		console.log('setupAPIConnection')

		const socket = io(`127.0.0.1:${DEFAULT_DEV_API_PORT}`)
		socket.on('connect', () => {
			this.connected = true
			this.emit('connected')
		})
		socket.on('disconnect', () => {
			this.connected = false
			this.emit('disconnected')
		})

		const socketClient = socketio(socket)

		this.app = feathers<AddTypeToProperties<ServiceTypes, SocketService>>()
		this.app.configure(socketClient)

		{
			this.app.use(
				Services.Playlist,
				socketClient.service(Services.Playlist) as SocketService & ServiceTypes[Services.Playlist],
				{
					methods: PlaylistServiceDefinition.ALL_METHODS,
				}
			)
			this.playlist = this.app.service(Services.Playlist) as FeathersTypedService<PlaylistServiceDefinition.Service>
		}
		{
			this.app.use(
				Services.Example,
				socketClient.service(Services.Example) as SocketService & ServiceTypes[Services.Example],
				{
					methods: ExampleServiceDefinition.ALL_METHODS,
				}
			)
			this.example = this.app.service(Services.Example) as FeathersTypedService<ExampleServiceDefinition.Service>
		}
	}
}
