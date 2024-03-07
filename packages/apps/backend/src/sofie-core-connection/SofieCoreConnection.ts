import {
	CoreConnection,
	CoreOptions,
	DDPConnectorOptions,
	protectString,
	JSONBlobStringify,
	StatusCode,
	ProtectedString,
} from '@sofie-automation/server-core-integration'
import { AnyProtectedString, PartId, RundownPlaylistId, ScriptContents } from '@sofie-prompter-editor/shared-model'
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
import { autorun, observe } from 'mobx'
import { RundownHandler } from './dataHandlers/RundownHandler.js'
import { SegmentHandler } from './dataHandlers/SegmentHandler.js'
import { PartHandler } from './dataHandlers/PartHandler.js'
import { Transformers } from './dataTransformers/Transformers.js'
import { PieceHandler } from './dataHandlers/PieceHandler.js'
import { ShowStyleBaseHandler } from './dataHandlers/ShowStyleBaseHandler.js'
import { ExpectedPackageHandler } from './dataHandlers/ExpectedPackageHandler.js'
import * as fs from 'fs'
import * as path from 'path'
import { ExpectedPackageId } from './CoreDataTypes/Ids.js'
import { removeMarkdownish, stringifyError } from '@sofie-prompter-editor/shared-lib'
import { PackageInfoHandler } from './dataHandlers/PackageInfoHandler.js'
import { PROMPTER_PACKAGE_INFO_TYPE } from './CoreDataTypes/PackageInfo.js'

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

	private transformers: Transformers
	private coreDataHandlers: DataHandler[] = []

	private subscriberManager: SubscriberManager

	constructor(log: LoggerInstance, options: ConfigOptions, processHandler: ProcessHandler, private store: Store) {
		super()
		this.log = log.category('SofieCoreConnection')

		this.subscriberManager = new SubscriberManager(this.log)

		const packageJSONPath = path.resolve('package.json')
		const packageJson = JSON.parse(fs.readFileSync(packageJSONPath, 'utf-8'))

		const coreOptions: CoreOptions = {
			deviceId: protectString(options.deviceId || 'prompter_editor'),
			deviceToken: options.deviceToken || 'superSecretToken',
			deviceCategory: PeripheralDeviceCategory.PACKAGE_MANAGER, // todo
			deviceType: 'prompter_editor' as PeripheralDeviceType, // todo
			deviceName: 'Prompter Editor',

			documentationUrl: 'https://github.com/nrkno/sofie-prompter-editor',
			versions: {
				_process: packageJson.version,
			}, // todo
			configManifest: {
				deviceConfigSchema: JSONBlobStringify({}),
				subdeviceManifest: {},
			},
		}

		this.core = new CoreConnection(coreOptions)
		this.transformers = new Transformers()

		this.store.connectTransformers(this.transformers)

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

			this.log.info('DeviceId: ' + this.core.deviceId)
			this.log.info('Setting up data handlers..')
			await this.setupDataHandlers()
			await this.setupSubscriptionManager()
			this.log.info('Setting up subscriptions..')
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
	public subscribeToPlaylist(playlistId: RundownPlaylistId) {
		// Add connection as a subscriber to the playlist:
		this.subscriberManager.subscribeToPlaylist(playlistId)
	}
	public unsubscribeFromPlaylistIfNoOneIsListening(playlistId: RundownPlaylistId, subscriberCount: number) {
		if (subscriberCount === 0) {
			// No one is listening to this playlist, so unsubscribe from it:
			this.subscriberManager.unsubscribeFromPlaylist(playlistId)
		}
	}
	public getSubscribedPlaylists() {
		// Return all subscriptions
		return this.subscriberManager.getSubscribedPlaylists()
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
		this.coreDataHandlers.push(new SettingsHandler(this.log, this.core, this.store, this.transformers))

		this.coreDataHandlers.push(new RundownPlaylistHandler(this.log, this.core, this.store, this.transformers))

		this.coreDataHandlers.push(new RundownHandler(this.log, this.core, this.store, this.transformers))
		this.coreDataHandlers.push(new SegmentHandler(this.log, this.core, this.store, this.transformers))
		this.coreDataHandlers.push(new PartHandler(this.log, this.core, this.store, this.transformers))
		this.coreDataHandlers.push(new PieceHandler(this.log, this.core, this.store, this.transformers))
		this.coreDataHandlers.push(new ExpectedPackageHandler(this.log, this.core, this.store, this.transformers))
		this.coreDataHandlers.push(new PackageInfoHandler(this.log, this.core, this.store, this.transformers))

		this.coreDataHandlers.push(new ShowStyleBaseHandler(this.log, this.core, this.store, this.transformers))

		// Wait for all DataHandlers to be initialized:
		await Promise.all(this.coreDataHandlers.map((handler) => handler.initialized))
	}
	/* Maps hash -> Array<subscriptionId>*/
	private subscriptions: Map<string, Promise<string | void>[]> = new Map()
	private addSubscription(hash: string, subId: Promise<string>): void {
		const orgError = new Error('')
		let subs = this.subscriptions.get(hash)
		if (!subs) {
			subs = []
			this.subscriptions.set(hash, subs)
		}
		subs.push(
			subId.catch(
				// (subId) => subId,
				(err) => {
					this.log.error(`Error subscribing to ${hash}: ${err} ${err.stack}`)
					this.log.error(`Stack: ${orgError.stack}`)
				}
			)
		)
	}
	private removeSubscription(hash: string): void {
		const subs = this.subscriptions.get(hash)
		if (!subs) return

		subs.forEach((sub) => {
			sub.then((subscriptionId) => {
				if (subscriptionId) this.core.unsubscribe(subscriptionId)
			})
		})
		this.subscriptions.delete(hash)
	}

	// private activeCoreSubscriptions: Map<string> = new Set()

	private async setupSubscriptionManager(): Promise<void> {
		// Set up subscriptions to all rundowns we know about:
		autorun(() => {
			this.subscriberManager.subscribeToRundowns(this.transformers.rundowns.rundownIds)
		})
		// Set up subscriptions to all showStyles we know about:
		autorun(() => {
			this.subscriberManager.setShowStyleBaseSubscriptions(this.transformers.rundowns.showStyleBaseIds)
		})
		// Set up subscriptions to all showStyle variants we know about:
		autorun(() => {
			this.subscriberManager.setShowStyleVariantSubscriptions(this.transformers.rundowns.showStyleVariantIds)
		})
	}
	private async autoSubscribe(
		release50PublicationName: string,
		release50Params: any[],
		release51PublicationName: string | undefined,
		release51Params: any[]
	): Promise<string> {
		// This is a temporary hack to support both release <=50 and 51.
		// (This hack can be removed when core-integration has been updated to >=v51)

		try {
			// First, try release <=50:
			return await this.core.autoSubscribe(release50PublicationName, ...release50Params)
		} catch (e) {
			if (`${e}`.match(/(Match failed)|(Subscription .* not found)/)) {
				// Try release51:
				return await this.core.autoSubscribe(release51PublicationName ?? release50PublicationName, ...release51Params)
			} else {
				throw e
			}
		}
	}
	private async setupCoreSubscriptions(): Promise<void> {
		// We always subscribe to these:
		await this.autoSubscribe('rundownPlaylists', [{}], undefined, [null, null])

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
				this.log.debug('Subscribing to playlist ' + playlistId)

				this.addSubscription(
					subHash,
					this.autoSubscribe(
						'rundownPlaylists',
						[
							{
								_id: playlistId,
							},
						],
						undefined,
						[[playlistId], null]
					)
				)
				this.addSubscription(
					subHash,
					this.autoSubscribe('rundowns', [[playlistId], null], 'rundownsInPlaylists', [[playlistId]])
				)
			} else if (change.type === 'update') {
				// console.log('update  ', change.newValue)
				// this.emit('updated', change.newValue)
			} else if (change.type === 'delete') {
				// console.log('removed', change.oldValue)
				this.removeSubscription(subHash)
			}
		})
		// Subscribe to all data in rundowns:
		observe(this.subscriberManager.rundowns, (change) => {
			if (change.type === 'add') {
				const rundownId = change.newValue
				const subHash = `rundown_${rundownId}`

				this.log.debug('Subscribing to rundown ' + rundownId)

				this.addSubscription(
					subHash,
					this.autoSubscribe(
						'segments',
						[
							{
								rundownId: rundownId,
							},
						],
						undefined,
						[[rundownId], {}]
					)
				)
				this.addSubscription(subHash, this.autoSubscribe('parts', [rundownId], undefined, [[rundownId], null]))
				this.addSubscription(
					subHash,
					this.autoSubscribe(
						'pieces',
						[
							{
								startRundownId: rundownId,
							},
						],
						undefined,
						[[rundownId], null]
					)
				)
				this.addSubscription(
					subHash,
					this.autoSubscribe(
						'expectedPackages',
						[
							{
								fromPieceType: 'piece',
								rundownId: rundownId,
							},
						],
						undefined,
						[[rundownId], null] // TODO - this might not work
					)
				)
				this.addSubscription(
					subHash,
					this.autoSubscribe('packageInfos', [this.core.deviceId], undefined, [
						this.core.deviceId, // TODO - verify this works
					])
				)
			} else if (change.type === 'delete') {
				this.removeSubscription(`rundown_${change.oldValue}`)
			}
		})
		// Subscribe to showStyleBases:
		observe(this.subscriberManager.showStyleBases, (change) => {
			if (change.type === 'add') {
				const showStyleBaseId = change.newValue
				const subHash = `showStyleBase_${showStyleBaseId}`
				this.log.debug('Subscribing to ShowStyleBase ' + showStyleBaseId)

				this.addSubscription(
					subHash,
					this.autoSubscribe(
						'showStyleBases',
						[
							{
								_id: showStyleBaseId,
							},
						],
						undefined,
						[[showStyleBaseId]]
					)
				)
			} else if (change.type === 'delete') {
				this.removeSubscription(`showStyleBase_${change.oldValue}`)
			}
		})

		this.log.info('Core: Subscriptions are set up!')
	}

	#runningAndPendingEditedScripts = new Map<ExpectedPackageId, { pending: ScriptSavingState | null }>()

	/**
	 * Save the edited script for a Part to a Sofie PackageInfo
	 * @param partId Id of the part to write to
	 * @param script New script contents (including markdown)
	 */
	public saveEditedScript(partId: PartId, script: ScriptContents): void {
		const storedPart = this.store.parts.parts.get(partId)
		if (!storedPart) throw new Error(`Part "${partId}" does not exist`)

		const storedPackageInfo = storedPart.scriptPackageInfo
		if (!storedPackageInfo) throw new Error(`Part "${partId}" is not editable`)

		// Collect all the data needed for the save, the Rundown could become unloaded before the save begins
		const packageId: ExpectedPackageId = this.convertId(storedPackageInfo.packageId)
		const saveInfo: ScriptSavingState = {
			originalScript: storedPart.scriptContents,
			pendingScript: script,
			contentVersionHash: storedPackageInfo.contentVersionHash,
		}

		/**
		 * This uses #runningAndPendingEditedScripts as a simple 'queue', to ensure that there is never more than
		 * 1 write for a packageId in flight at a time. Subsequent calls to this method will be queued and batched
		 * so that the latest script is written back once the current one has completed.
		 *
		 * It might be benficial to debounce these writes too, but the cost inside of Sofie is minimal as it already
		 * debounces the updates before performing ingest, the most a debounce here would do is to avoid excessive
		 * write to mongodb
		 */

		const runningState = this.#runningAndPendingEditedScripts.get(packageId)
		if (runningState) {
			// A save is already in progress or queued, store the new script to be written
			runningState.pending = saveInfo

			return
		}

		// Mark this package as being updated, with no pending value
		this.#runningAndPendingEditedScripts.set(packageId, { pending: null })

		this.#performSaveEditedScript(packageId, saveInfo)
	}

	#performSaveEditedScript(packageId: ExpectedPackageId, saveInfo: ScriptSavingState): void {
		const payload: ScriptPackageInfoPayload = {
			originalScript: saveInfo.originalScript,
			modifiedScriptMarkdown: saveInfo.pendingScript,
			modifiedScriptSimple: removeMarkdownish(saveInfo.pendingScript),
			modified: Date.now(),
		}

		this.core.coreMethods
			.updatePackageInfo(
				PROMPTER_PACKAGE_INFO_TYPE,
				packageId,
				saveInfo.contentVersionHash,
				payload.modified + '',
				payload
			)
			.catch((err) => {
				this.log.error(`Failed to write PackageInfo back to Sofie: ${stringifyError(err)}`)
			})
			.finally(() => {
				const runState = this.#runningAndPendingEditedScripts.get(packageId)
				if (runState?.pending) {
					// New info has been queued, execute the save
					const newSaveInfo = runState.pending
					runState.pending = null

					this.#performSaveEditedScript(packageId, newSaveInfo)
				} else {
					// Nothing more to run
					this.#runningAndPendingEditedScripts.delete(packageId)
				}
			})
	}

	private convertId<B extends AnyProtectedString, A extends ProtectedString<any>>(id: B): A
	private convertId<A extends ProtectedString<any>, B extends AnyProtectedString>(id: A): B
	private convertId<A, B>(id: A): B {
		return id as any
	}
}

interface ScriptSavingState {
	originalScript: string
	pendingScript: string
	contentVersionHash: string
}

// PackageInfo type, as known in the nrk-blueprints
export interface ScriptPackageInfoPayload {
	originalScript: string
	modifiedScriptMarkdown: string
	modifiedScriptSimple: string
	modified: number
}
