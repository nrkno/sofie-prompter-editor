import io from 'socket.io-client'
import { EventEmitter } from 'eventemitter3'
import { feathers, Application } from '@feathersjs/feathers'
import socketio, { SocketService } from '@feathersjs/socketio-client'
import {
	ExampleServiceDefinition,
	PlaylistServiceDefinition,
	RundownServiceDefinition,
	SegmentServiceDefinition,
	PartServiceDefinition,
	PrompterSettingsServiceDefinition,
	ViewPortServiceDefinition,
	ServiceTypes,
	Services,
} from '@sofie-prompter-editor/shared-model'
import { DEFAULT_DEV_API_HOST, DEFAULT_DEV_API_PORT } from '@sofie-prompter-editor/shared-lib'
import { AddTypeToProperties, FeathersTypedService } from './lib.ts'

interface APIConnectionEvents {
	connected: []
	disconnected: []
}

export class APIConnection extends EventEmitter<APIConnectionEvents> {
	public readonly playlist: FeathersTypedService<PlaylistServiceDefinition.Service>
	public readonly rundown: FeathersTypedService<RundownServiceDefinition.Service>
	public readonly segment: FeathersTypedService<SegmentServiceDefinition.Service>
	public readonly part: FeathersTypedService<PartServiceDefinition.Service>

	public readonly prompterSettings: FeathersTypedService<PrompterSettingsServiceDefinition.Service>
	public readonly viewPort: FeathersTypedService<ViewPortServiceDefinition.Service>

	public readonly example: FeathersTypedService<ExampleServiceDefinition.Service>
	public connected = false

	private app: Application<AddTypeToProperties<ServiceTypes, SocketService>, unknown>

	constructor(public readonly host = DEFAULT_DEV_API_HOST, public readonly port = DEFAULT_DEV_API_PORT) {
		super()
		console.log('setupAPIConnection')

		const socket = io(`${host}:${port}`)
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
				Services.Rundown,
				socketClient.service(Services.Rundown) as SocketService & ServiceTypes[Services.Rundown],
				{
					methods: RundownServiceDefinition.ALL_METHODS,
				}
			)
			this.rundown = this.app.service(Services.Rundown) as FeathersTypedService<RundownServiceDefinition.Service>
		}
		{
			this.app.use(
				Services.Segment,
				socketClient.service(Services.Segment) as SocketService & ServiceTypes[Services.Segment],
				{
					methods: SegmentServiceDefinition.ALL_METHODS,
				}
			)
			this.segment = this.app.service(Services.Segment) as FeathersTypedService<SegmentServiceDefinition.Service>
		}
		{
			this.app.use(Services.Part, socketClient.service(Services.Part) as SocketService & ServiceTypes[Services.Part], {
				methods: PartServiceDefinition.ALL_METHODS,
			})
			this.part = this.app.service(Services.Part) as FeathersTypedService<PartServiceDefinition.Service>
		}

		{
			this.app.use(
				Services.PrompterSettings,
				socketClient.service(Services.PrompterSettings) as SocketService & ServiceTypes[Services.PrompterSettings],
				{
					methods: PrompterSettingsServiceDefinition.ALL_METHODS,
				}
			)
			this.prompterSettings = this.app.service(
				Services.PrompterSettings
			) as FeathersTypedService<PrompterSettingsServiceDefinition.Service>
		}
		{
			this.app.use(
				Services.ViewPort,
				socketClient.service(Services.ViewPort) as SocketService & ServiceTypes[Services.ViewPort],
				{
					methods: ViewPortServiceDefinition.ALL_METHODS,
				}
			)
			this.viewPort = this.app.service(Services.ViewPort) as FeathersTypedService<ViewPortServiceDefinition.Service>
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
