import { RealTimeConnection, feathers } from '@feathersjs/feathers'
import { koa, rest, bodyParser, errorHandler, serveStatic, cors, Application } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'
import { EventEmitter } from 'eventemitter3'
import { RundownPlaylistId, ServiceTypes } from '@sofie-prompter-editor/shared-model'
import { LoggerInstance } from '../lib/logger.js'
import { PublishChannels } from './PublishChannels.js'
import { PlaylistFeathersService, PlaylistService } from './services/PlaylistService.js'
import { RundownFeathersService, RundownService } from './services/RundownService.js'
import { SegmentFeathersService, SegmentService } from './services/SegmentService.js'
import { PartFeathersService, PartService } from './services/PartService.js'
import { ExampleFeathersService, ExampleService } from './services/ExampleService.js'
import { Store } from '../data-stores/Store.js'
import { SofieCoreConnection } from '../sofie-core-connection/SofieCoreConnection.js'
import { ViewPortFeathersService, ViewPortService } from './services/ViewPortService.js'
import { PrompterSettingsFeathersService, PrompterSettingsService } from './services/PrompterSettingsService.js'

export type ApiServerEvents = {
	connection: []
}
export class ApiServer extends EventEmitter<ApiServerEvents> {
	private app = koa<ServiceTypes>(feathers())

	public initialized: Promise<void>
	public readonly playlist: PlaylistFeathersService
	public readonly rundown: RundownFeathersService
	public readonly segment: SegmentFeathersService
	public readonly part: PartFeathersService
	public readonly example: ExampleFeathersService
	public readonly viewPort: ViewPortFeathersService
	public readonly prompterSettings: PrompterSettingsFeathersService

	private log: LoggerInstance
	constructor(
		log: LoggerInstance,
		port: number,
		private store: Store,
		private coreConnection: SofieCoreConnection | undefined
	) {
		super()
		this.log = log.category('ApiServer')

		this.app.use(serveStatic('src'))

		this.app.use(
			cors({
				origin: '*', // TODO: cors
			})
		)

		this.app.use(errorHandler())
		this.app.use(bodyParser())
		this.app.configure(rest())
		this.app.configure(socketio({ cors: { origin: '*' } })) // TODO: cors

		this.playlist = PlaylistService.setupService(this.log, this.app, this.store)
		this.rundown = RundownService.setupService(this.log, this.app, this.store, this.coreConnection)
		this.segment = SegmentService.setupService(this.log, this.app, this.store)
		this.part = PartService.setupService(this.log, this.app, this.store)

		this.viewPort = ViewPortService.setupService(this.log, this.app, this.store)
		this.prompterSettings = PrompterSettingsService.setupService(this.log, this.app, this.store)

		this.example = ExampleService.setupService(this.app)

		this.app.on('connection', (connection: RealTimeConnection) => {
			// A new client connection has been made
			this.emit('connection')

			// Add the connection to the Anything channel:
			this.app.channel(PublishChannels.Everyone()).join(connection)
		})
		this.app.on('disconnect', (_connection: RealTimeConnection) => {
			// A client disconnected.
			// Note: A disconnected client will leave all channels automatically.

			if (this.coreConnection) {
				for (const playlistId of this.coreConnection.getSubscribedPlaylists()) {
					this.unsubscribeFromPlaylistIfNoOneIsListening(playlistId, this.app)
				}
			}
		})

		this.playlist.on('tmpPong', (payload: string) => {
			console.log('a pong', payload)
		})

		this.initialized = new Promise<void>((resolve, reject) => {
			this.app
				.listen(port)
				.then(() => {
					this.log.info('Feathers server listening on localhost:' + port)
					resolve()
				})
				.catch(reject)
		})
	}
	public unsubscribeFromPlaylistIfNoOneIsListening(playlistId: RundownPlaylistId, app: Application<ServiceTypes, any>) {
		// Check if no one is subscribed to this playlist and unsubscribe from it if so:

		const subscriberCount = app.channel(PublishChannels.RundownsInPlaylist(playlistId)).length
		if (subscriberCount === 0) {
			// No one is listening to this playlist, so unsubscribe from it:
			this.coreConnection?.unsubscribeFromPlaylist(playlistId)
		}
	}
}
