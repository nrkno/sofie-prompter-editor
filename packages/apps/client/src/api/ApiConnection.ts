import io from 'socket.io-client'
import { EventEmitter } from 'eventemitter3'
import { feathers, Application } from '@feathersjs/feathers'
import socketio, { SocketService } from '@feathersjs/socketio-client'
import {
	ExampleServiceDefinition,
	SystemStatusServiceDefinition,
	ControllerServiceDefinition,
	OutputSettingsServiceDefinition,
	ViewPortServiceDefinition,
	PlaylistServiceDefinition,
	RundownServiceDefinition,
	SegmentServiceDefinition,
	PartServiceDefinition,
	ServiceTypes,
	Services,
} from '@sofie-prompter-editor/shared-model'
import { AddTypeToProperties, FeathersTypedService } from './lib.ts'

interface APIConnectionEvents {
	connected: []
	disconnected: []
}

export class APIConnection extends EventEmitter<APIConnectionEvents> {
	public readonly systemStatus: FeathersTypedService<SystemStatusServiceDefinition.Service>

	public readonly playlist: FeathersTypedService<PlaylistServiceDefinition.Service>
	public readonly rundown: FeathersTypedService<RundownServiceDefinition.Service>
	public readonly segment: FeathersTypedService<SegmentServiceDefinition.Service>
	public readonly part: FeathersTypedService<PartServiceDefinition.Service>

	public readonly controller: FeathersTypedService<ControllerServiceDefinition.Service>
	public readonly outputSettings: FeathersTypedService<OutputSettingsServiceDefinition.Service>
	public readonly viewPort: FeathersTypedService<ViewPortServiceDefinition.Service>

	public readonly example: FeathersTypedService<ExampleServiceDefinition.Service>
	public connected = false

	private app: Application<AddTypeToProperties<ServiceTypes, SocketService>, unknown>

	constructor() {
		super()

		const socket = io()
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
				Services.SystemStatus,
				socketClient.service(Services.SystemStatus) as SocketService & ServiceTypes[Services.SystemStatus],
				{
					methods: SystemStatusServiceDefinition.ALL_METHODS,
				}
			)
			this.systemStatus = this.app.service(
				Services.SystemStatus
			) as FeathersTypedService<SystemStatusServiceDefinition.Service>
		}

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
				Services.Controller,
				socketClient.service(Services.Controller) as SocketService & ServiceTypes[Services.Controller],
				{
					methods: ControllerServiceDefinition.ALL_METHODS,
				}
			)
			this.controller = this.app.service(
				Services.Controller
			) as FeathersTypedService<ControllerServiceDefinition.Service>
		}
		{
			this.app.use(
				Services.OutputSettings,
				socketClient.service(Services.OutputSettings) as SocketService & ServiceTypes[Services.OutputSettings],
				{
					methods: OutputSettingsServiceDefinition.ALL_METHODS,
				}
			)
			this.outputSettings = this.app.service(
				Services.OutputSettings
			) as FeathersTypedService<OutputSettingsServiceDefinition.Service>
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
