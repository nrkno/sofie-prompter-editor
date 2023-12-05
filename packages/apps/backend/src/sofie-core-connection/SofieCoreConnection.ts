import {
	CoreConnection,
	CoreOptions,
	DDPConnectorOptions,
	protectString,
	JSONBlobStringify,
	StatusCode,
} from '@sofie-automation/server-core-integration'
import { RealTimeConnection } from '@feathersjs/feathers'
import { RundownPlaylistId } from '@sofie-prompter-editor/shared-model'
import {
	PeripheralDeviceCategory,
	PeripheralDeviceType,
} from '@sofie-automation/shared-lib/dist/peripheralDevice/peripheralDeviceAPI.js'
import { EventEmitter } from 'eventemitter3'
import { LoggerInstance } from '../lib/logger.js'
import { ConfigOptions } from '../lib/config.js'
import { ProcessHandler } from '../lib/ProcessHandler.js'
import { Store } from '../data-stores/Store.js'
import { DataHandler } from './dataHandlers/DataHandler.js'
import { SettingsHandler } from './dataHandlers/SettingsHandler.js'
import { RundownPlaylistHandler } from './dataHandlers/RundownPlaylistHandler.js'
import { SubscriberManager } from './SubscriberManager.js'
import { observe } from 'mobx'
import { RundownHandler } from './dataHandlers/RundownHandler.js'
import { SegmentHandler } from './dataHandlers/SegmentHandler.js'
import { PartHandler } from './dataHandlers/PartHandler.js'

interface SofieCoreConnectionEvents {
	connected: []
	disconnected: []
}

export class SofieCoreConnection extends EventEmitter<SofieCoreConnectionEvents> {
	public initialized: Promise<void>
	private isInitialized = false
	private destroyed = false
	private core: CoreConnection
	private log: LoggerInstance
	private statuses: Map<string, { status: StatusCode; message: string }> = new Map()

	private coreDataHandlers: DataHandler[] = []

	private subscriberManager = new SubscriberManager()

	constructor(log: LoggerInstance, options: ConfigOptions, processHandler: ProcessHandler, private store: Store) {
		super()
		this.log = log.category('SofieCoreConnection')

		const coreOptions: CoreOptions = {
			deviceId: protectString(options.deviceId || 'prompter_editor'),
			deviceToken: options.deviceToken || 'superSecretToken',
			deviceCategory: PeripheralDeviceCategory.PACKAGE_MANAGER, // todo
			deviceType: 'prompter_editor' as PeripheralDeviceType, // todo
			deviceName: 'Prompter Editor',

			documentationUrl: 'https://github.com/nrkno/sofie-prompter-editor',
			versions: {}, // todo
			configManifest: {
				deviceConfigSchema: JSONBlobStringify({}),
				subdeviceManifest: {},
			},
		}

		this.core = new CoreConnection(coreOptions)

		this.initialized = Promise.resolve().then(async () => {
			// connect to core
			// subscribe to data

			this.core.onConnected(() => this.emit('connected'))
			this.core.onDisconnected(() => this.emit('disconnected'))
			this.core.onError((err) => {
				this.log.error(`Core Error: ${typeof err === 'string' ? err : err.message || err.toString() || err}`)
			})

			const ddpConfig: DDPConnectorOptions = {
				host: options.coreHost,
				port: options.corePort,
			}
			if (processHandler.certificates.length) {
				ddpConfig.tlsOpts = {
					ca: processHandler.certificates,
				}
			}

			await this.core.init(ddpConfig)

			await this.setupDataHandlers()
			await this.setupCoreSubscriptions()

			const peripheralDevice = await this.core.getPeripheralDevice()
			if (!peripheralDevice.studioId) {
				this.setStatus('notSetup', StatusCode.BAD, 'Not assigned to a studio')
			}

			await this.updateCoreStatus()

			this.log.info(`Device studioId: "${peripheralDevice.studioId}"`)

			if (!peripheralDevice.studioId) {
				this.log.warn('------------------------------------------------------')
				this.log.warn('Not setup yet, exiting process!')
				this.log.warn('To setup, go into Core and add this device to a Studio')
				this.log.warn('------------------------------------------------------')
				process.exit(1) // eslint-disable-line no-process-exit
				return
			}

			this.isInitialized = true
			await this.updateCoreStatus()
		})
	}
	async destroy(): Promise<void> {
		this.destroyed = true
		await this.updateCoreStatus()
		await this.core.destroy()
	}
	public subscribeToPlaylist(connection: RealTimeConnection, playlistId: RundownPlaylistId) {
		// Add connection as a subscriber to the playlist:
		this.subscriberManager.subscribeToPlaylist(connection, playlistId)
	}
	public unsubscribe(connection: RealTimeConnection) {
		// Remove connection from all subscriptions
		this.subscriberManager.unsubscribeFromPlaylists(connection)
	}
	private setStatus(id: string, status: StatusCode, message: string): void {
		this.statuses.set(id, { status, message })
		this.updateCoreStatus().catch((err) => this.log.error(err))
	}
	private async updateCoreStatus(): Promise<any> {
		let statusCode = StatusCode.GOOD
		const messages: Array<string> = []

		if (this.destroyed) {
			statusCode = StatusCode.BAD
			messages.push('Shutting down')
		} else if (!this.isInitialized) {
			statusCode = StatusCode.BAD
			messages.push('Starting up...')
		} else {
			this.statuses.forEach((status) => {
				if (status.status > statusCode) statusCode = status.status
				messages.push(status.message)
			})
		}

		return this.core.setStatus({
			statusCode: statusCode,
			messages: messages,
		})
	}
	private async setupDataHandlers(): Promise<void> {
		this.log.info('Setting up subscriptions..')
		this.log.info('DeviceId: ' + this.core.deviceId)

		this.coreDataHandlers.push(new SettingsHandler(this.log, this.core, this.store))
		this.coreDataHandlers.push(new RundownPlaylistHandler(this.log, this.core, this.store))
		this.coreDataHandlers.push(new RundownHandler(this.log, this.core, this.store))
		this.coreDataHandlers.push(new SegmentHandler(this.log, this.core, this.store))
		this.coreDataHandlers.push(new PartHandler(this.log, this.core, this.store))

		// Wait for all DataHandlers to be initialized:
		await Promise.all(this.coreDataHandlers.map((handler) => handler.initialized))
	}
	/* Maps hash -> Array<subscriptionId>*/
	private subscriptions: Map<string, Promise<string>[]> = new Map()
	private addSubscription(hash: string, subId: Promise<string>): void {
		let subs = this.subscriptions.get(hash)
		if (!subs) {
			subs = []
			this.subscriptions.set(hash, subs)
		}
		subs.push(subId)
	}

	// private activeCoreSubscriptions: Map<string> = new Set()

	private async setupCoreSubscriptions(): Promise<void> {
		// We always subscribe to these:
		await this.core.autoSubscribe('rundownPlaylists', {})

		// this.core.autoSubscribe('peripheralDeviceCommands', this.core.deviceId),

		// this.core.autoSubscribe('packageManagerPlayoutContext', this.core.deviceId),
		// this.core.autoSubscribe('packageManagerPackageContainers', this.core.deviceId),
		// this.core.autoSubscribe('packageManagerExpectedPackages', this.core.deviceId, undefined),

		// this.core.autoSubscribe('rundownPlaylists', {}),

		// Subscribe to rundowns in playlists:
		observe(this.subscriberManager.playlists, (change) => {
			const playlistId = change.name
			const subHash = `playlist_${playlistId}`

			if (change.type === 'add') {
				this.log.info('Subscribing to playlist ' + playlistId)

				this.addSubscription(
					subHash,
					this.core.autoSubscribe('rundownPlaylists', {
						_id: playlistId,
					})
				)
				this.addSubscription(subHash, this.core.autoSubscribe('rundowns', [playlistId], null))
			} else if (change.type === 'update') {
				console.log('update  ', change.newValue)
				// this.emit('updated', change.newValue)
			} else if (change.type === 'delete') {
				console.log('removed', change.oldValue)

				const subs = this.subscriptions.get(subHash) || []

				// No one is subscribed to this anymore, so unsubscribe:
				subs.forEach((sub) => {
					sub.then((subscriptionId) => {
						this.core.unsubscribe(subscriptionId)
					})
				})
				this.subscriptions.delete(subHash)
			}
		})

		observe(this.store.rundowns.rundowns, (change) => {
			if (change.type === 'add') {
				this.subscriberManager.subscribeToRundown(change.name)
			} else if (change.type === 'delete') {
				this.subscriberManager.unsubscribeFromRundown(change.name)
			}
		})
		// Subscribe to all data in rundowns:
		observe(this.subscriberManager.rundowns, (change) => {
			if (change.type === 'add') {
				const rundownId = change.newValue
				const subHash = `rundown_${rundownId}`

				this.log.info('Subscribing to rundown ' + rundownId)

				this.addSubscription(
					subHash,
					this.core.autoSubscribe('segments', {
						rundownId: rundownId,
					})
				)
				this.addSubscription(subHash, this.core.autoSubscribe('parts', [rundownId]))
				this.addSubscription(
					subHash,
					this.core.autoSubscribe('pieces', {
						startRundownId: rundownId,
					})
				)
				// } else if (change.type === 'update') {
				// 	console.log('update  ', change.newValue)
				// this.emit('updated', change.newValue)
			} else if (change.type === 'delete') {
				const subHash = `rundown_${change.oldValue}`
				console.log('removed', change.oldValue)

				const subs = this.subscriptions.get(subHash) || []

				// No one is subscribed to this anymore, so unsubscribe:
				subs.forEach((sub) => {
					sub.then((subscriptionId) => {
						this.core.unsubscribe(subscriptionId)
					})
				})
				this.subscriptions.delete(subHash)
			}
		})

		this.log.info('Core: Subscriptions are set up!')
	}
}
