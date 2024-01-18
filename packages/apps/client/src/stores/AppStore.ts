import type EventEmitter from 'eventemitter3'
import { action, makeObservable, observable } from 'mobx'
import { RundownStore } from './RundownStore'
import { MockConnection } from '../mocks/MockConnection'
import { UIStore } from './UIStore'
import { APIConnection as APIConnectionImpl } from '../api/ApiConnection.ts'
import { FeathersTypedService } from '../api/lib.ts'
import {
	SystemStatusServiceDefinition,
	ControllerServiceDefinition,
	OutputSettingsServiceDefinition,
	ViewPortServiceDefinition,
	PlaylistServiceDefinition,
	RundownServiceDefinition,
	SegmentServiceDefinition,
	ExampleServiceDefinition,
	PartServiceDefinition,
} from '@sofie-prompter-editor/shared-model'

const USE_MOCK_CONNECTION = false

class AppStoreClass {
	connected = false
	connection: APIConnection
	rundownStore: RundownStore
	uiStore: UIStore

	constructor() {
		makeObservable(this, {
			connected: observable,
		})

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const apiConnection = USE_MOCK_CONNECTION ? (new MockConnection() as any) : new APIConnectionImpl()
		this.connection = apiConnection
		this.rundownStore = new RundownStore(this, this.connection)
		this.uiStore = new UIStore()

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

export const AppStore = new AppStoreClass()

export interface APIConnection extends EventEmitter {
	readonly connected: boolean
	readonly host: string
	readonly port: number

	readonly systemStatus: FeathersTypedService<SystemStatusServiceDefinition.Service>

	readonly playlist: FeathersTypedService<PlaylistServiceDefinition.Service>
	readonly rundown: FeathersTypedService<RundownServiceDefinition.Service>
	readonly segment: FeathersTypedService<SegmentServiceDefinition.Service>
	readonly part: FeathersTypedService<PartServiceDefinition.Service>

	readonly controllerMessage: FeathersTypedService<OutputSettingsServiceDefinition.Service>
	readonly outputSettings: FeathersTypedService<OutputSettingsServiceDefinition.Service>
	readonly viewPort: FeathersTypedService<ViewPortServiceDefinition.Service>

	readonly example: FeathersTypedService<ExampleServiceDefinition.Service>
}
