import type EventEmitter from 'eventemitter3'
import { IReactionDisposer, action, makeObservable, observable, reaction } from 'mobx'
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
import { SystemStatusStore } from './SystemStatusStore.ts'
import { ViewPortStore } from './ViewportStateStore.ts'
import { TriggerStore } from './TriggerStore.ts'
import { TriggerActionHandler } from '../lib/triggerActions/TriggerActionHandler.ts'
import { ControlStore } from './ControlStore.ts'

const USE_MOCK_CONNECTION = false

class RootAppStoreClass {
	connected = false
	sofieConnected = false
	connection: APIConnection
	rundownStore: RundownStore
	systemStatusStore: SystemStatusStore
	outputSettingsStore: OutputSettingsStore
	viewportStore: ViewPortStore
	triggerStore: TriggerStore
	uiStore: UIStore
	control: ControlStore

	private triggerActionHandler: TriggerActionHandler

	constructor() {
		makeObservable(this, {
			connected: observable,
			sofieConnected: observable,
		})

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const apiConnection = USE_MOCK_CONNECTION ? (new MockConnection() as any) : new APIConnectionImpl()
		this.connection = apiConnection
		this.rundownStore = new RundownStore(this, this.connection)
		this.systemStatusStore = new SystemStatusStore(this, this.connection)
		this.outputSettingsStore = new OutputSettingsStore(this, this.connection)
		this.viewportStore = new ViewPortStore(this, this.connection)
		this.triggerStore = new TriggerStore(this, this.connection)
		this.uiStore = new UIStore()
		this.control = new ControlStore(this, this.connection)

		this.connection.on('disconnected', this.onDisconnected)
		this.connection.on('connected', this.onConnected)

		this.connection.systemStatus.subscribe()
		this.connection.systemStatus.on('updated', this.onSystemStatusUpdated)
		this.connection.systemStatus.get(null).then(this.onSystemStatusUpdated)

		this.triggerActionHandler = new TriggerActionHandler(this)
	}

	onSystemStatusUpdated = action(
		'onSystemStatusUpdated',
		(systemStatus: { statusMessage: string | null; connectedToCore: boolean }) => {
			console.log(systemStatus)
			this.sofieConnected = systemStatus.connectedToCore
		}
	)

	onConnected = action('onConnected', () => {
		console.log('Backend connected')
		this.connected = true
	})

	onDisconnected = action('onDisconnected', () => {
		console.log('Backend disconnected')
		this.connected = false
	})

	/** Run the callback as soon as the backend connection is set up and re-run every time the system reconnects.
	 * Useful for setting up subscriptions and getting initial data. */
	whenConnected = (clb: () => void | Promise<void>): IReactionDisposer => {
		return reaction(
			() => this.connected,
			async (connected) => {
				if (!connected) return

				await clb()
			},
			{
				fireImmediately: true,
			}
		)
	}
}

export const RootAppStore = new RootAppStoreClass()

export interface APIConnection extends EventEmitter {
	readonly connected: boolean
	// readonly host: string
	// readonly port: number

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
