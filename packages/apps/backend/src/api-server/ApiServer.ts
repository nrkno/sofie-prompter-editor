import { HookContext, feathers } from '@feathersjs/feathers'
import { koa, rest, bodyParser, errorHandler, serveStatic, cors } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'
import { EventEmitter } from 'eventemitter3'
import { ClientMethods, PublishChannels, ServiceTypes, Services } from '@sofie-prompter-editor/shared-model'
import { PlaylistService, PlaylistServiceDefinition } from './services/PlaylistService.js'
import { LoggerInstance } from '../lib/logger.js'
// lib ==========================================

// =============================================
export type ApiServerEvents = {
	connection: []
}
export class ApiServer extends EventEmitter<ApiServerEvents> {
	private app = koa<ServiceTypes>(feathers())

	public initialized: Promise<void>

	constructor(log: LoggerInstance, port: number) {
		super()
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

		this.app.use(
			Services.Playlist,
			new PlaylistService(),
			// this.app
			{
				methods: ClientMethods[Services.Playlist],
				serviceEvents: [],
				events: [],
			}
		)
		this.app.service(Services.Playlist).publish((data: PlaylistServiceDefinition.Result, _context: HookContext) => {
			return this.app.channel(`${PublishChannels.Playlists}/${data._id}`)
		})

		this.app.on('connection', (_connection) => {
			this.emit('connection')
			// this.app.channel('everybody').join(connection)
			// this.app.channel(PROJECTS_CHANNEL_PREFIX).join(connection) // TODO: use ids and remove this
		})

		this.initialized = new Promise<void>((resolve, reject) => {
			this.app
				.listen(port)
				.then(() => {
					log.info('Feathers server listening on localhost:' + port)
					resolve()
				})
				.catch(reject)
		})
	}
}
