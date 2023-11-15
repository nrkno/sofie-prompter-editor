import { feathers } from '@feathersjs/feathers'
import { koa, rest, bodyParser, errorHandler, serveStatic, cors } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'
import { EventEmitter } from 'eventemitter3'
import { ServiceTypes } from '@sofie-prompter-editor/shared-model'
import { LoggerInstance } from '../lib/logger.js'
import { PublishChannels } from './PublishChannels.js'
import { PlaylistFeathersService, PlaylistService } from './services/PlaylistService.js'
import { ExampleFeathersService, ExampleService } from './services/ExampleService.js'
import { Store } from '../data-stores/Store.js'

export type ApiServerEvents = {
	connection: []
}
export class ApiServer extends EventEmitter<ApiServerEvents> {
	private app = koa<ServiceTypes>(feathers())

	public initialized: Promise<void>
	public readonly playlist: PlaylistFeathersService
	public readonly example: ExampleFeathersService

	private log: LoggerInstance
	constructor(log: LoggerInstance, port: number, private store: Store) {
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

		this.playlist = PlaylistService.setupService(this.app, this.store, this.log)
		this.example = ExampleService.setupService(this.app)

		this.app.on('connection', (connection) => {
			// A new client connection has been made
			this.emit('connection')

			// Add the connection to the Anything channel:
			this.app.channel(PublishChannels.Everyone()).join(connection)
		})
		this.app.on('disconnect', (_connection) => {
			// A client disconnected.
			// Note: A disconnected client will leave all channels automatically.
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
}
