import { RealTimeConnection, feathers } from '@feathersjs/feathers'
import { koa, rest, bodyParser, errorHandler, serveStatic, cors, FeathersKoaContext } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'
import { EventEmitter } from 'eventemitter3'
import { ServiceTypes, SystemStatus } from '@sofie-prompter-editor/shared-model'
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
import { OutputSettingsFeathersService, OutputSettingsService } from './services/OutputSettingsService.js'
import { ControllerFeathersService, ControllerService } from './services/ControllerService.js'
import { SystemStatusFeathersService, SystemStatusService } from './services/SystemStatusService.js'
import { fileURLToPath } from 'node:url'

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

	public readonly systemStatus: SystemStatusFeathersService
	public readonly controller: ControllerFeathersService
	public readonly viewPort: ViewPortFeathersService
	public readonly outputSettings: OutputSettingsFeathersService

	private log: LoggerInstance
	constructor(
		log: LoggerInstance,
		port: number,
		private store: Store,
		private coreConnection: SofieCoreConnection | undefined
	) {
		super()
		this.log = log.category('ApiServer')

		const serveStaticMiddleware = serveStatic(fileURLToPath(new URL('../../../client/dist', import.meta.url)))
		this.app.use(serveStaticMiddleware)

		this.app.use(
			cors({
				origin: '*', // TODO: cors
			})
		)

		const errorHandlerMiddleware = errorHandler()
		this.app.use((ctx: FeathersKoaContext, next) => {
			if (ctx.path.startsWith('/api/') || ctx.path === '/api') {
				return errorHandlerMiddleware(ctx, next)
			} else if (ctx.status === 404) {
				// Force serve the index as this is a SPA
				ctx.path = '/index.html'
				return serveStaticMiddleware(ctx, next)
			} else {
				next()
			}
		})
		this.app.use(bodyParser())
		this.app.configure(rest())
		this.app.configure(socketio({ cors: { origin: '*' } })) // TODO: cors

		this.playlist = PlaylistService.setupService(this.log, this.app, this.store)
		this.rundown = RundownService.setupService(this.log, this.app, this.store, this.coreConnection)
		this.segment = SegmentService.setupService(this.log, this.app, this.store)
		this.part = PartService.setupService(this.log, this.app, this.store)

		this.systemStatus = SystemStatusService.setupService(this.log, this.app, this.store)
		this.controller = ControllerService.setupService(this.log, this.app, this.store)
		this.viewPort = ViewPortService.setupService(this.log, this.app, this.store)
		this.outputSettings = OutputSettingsService.setupService(this.log, this.app, this.store)

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
					// Check if no one is subscribed to this playlist and unsubscribe from it if so:

					const subscriberCount = this.app.channel(PublishChannels.RundownsInPlaylist(playlistId)).length
					this.coreConnection?.unsubscribeFromPlaylistIfNoOneIsListening(playlistId, subscriberCount)
				}
			}
		})

		this.playlist.on('tmpPong', (payload: string) => {
			console.log('a pong', payload)
		})

		this.initialized = this.app.listen(port).then(() => {
			this.log.info('Feathers server listening on localhost:' + port)
		})
	}
}
