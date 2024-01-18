import type EventEmitter from 'eventemitter3'
import { action, makeObservable, observable } from 'mobx'
import { RundownStore } from './RundownStore.ts'
import { MockConnection } from '../mocks/MockConnection.ts'
import { UIStore } from './UIStore.ts'
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
import { OutputSettingsStore } from './OutputSettingsStore.ts'

const USE_MOCK_CONNECTION = false

class RootAppStoreClass {
	connected = false
	connection: APIConnection
	rundownStore: RundownStore
	outputSettingsStore: OutputSettingsStore
	uiStore: UIStore

	constructor() {
		makeObservable(this, {
			connected: observable,
		})

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const apiConnection = USE_MOCK_CONNECTION ? (new MockConnection() as any) : new APIConnectionImpl()
		this.connection = apiConnection
		this.rundownStore = new RundownStore(this, this.connection)
		this.outputSettingsStore = new OutputSettingsStore(this, this.connection)
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

export const RootAppStore = new RootAppStoreClass()

export interface APIConnection extends EventEmitter {
	readonly connected: boolean
	readonly host: string
	readonly port: number

	readonly systemStatus: FeathersTypedService<SystemStatusServiceDefinition.Service>
	readonly controller: FeathersTypedService<ControllerServiceDefinition.Service>
	readonly outputSettings: FeathersTypedService<OutputSettingsServiceDefinition.Service>
	readonly viewPort: FeathersTypedService<ViewPortServiceDefinition.Service>

	readonly playlist: FeathersTypedService<PlaylistServiceDefinition.Service>
	readonly rundown: FeathersTypedService<RundownServiceDefinition.Service>
	readonly segment: FeathersTypedService<SegmentServiceDefinition.Service>
	readonly part: FeathersTypedService<PartServiceDefinition.Service>

	readonly example: FeathersTypedService<ExampleServiceDefinition.Service>
}
