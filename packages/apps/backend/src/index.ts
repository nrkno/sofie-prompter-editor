import { DEFAULT_DEV_API_PORT } from '@sofie-prompter-editor/shared-lib'
import { ApiServer } from './api-server/ApiServer.js'
import { LoggerInstance, initializeLogger, isLogLevel, setLogLevel, setupLogger } from './lib/logger.js'
import { SofieCoreConnection } from './sofie-core-connection/SofieCoreConnection.js'
import { Store } from './data-stores/Store.js'
import { getConfigOptions } from './lib/config.js'
import { ProcessHandler } from './lib/ProcessHandler.js'

const loggerConfig = {}

initializeLogger(loggerConfig)
const log: LoggerInstance = setupLogger(loggerConfig, 'backend')

async function init() {
	const options = await getConfigOptions()
	if (options.logLevel && isLogLevel(options.logLevel)) setLogLevel(options.logLevel)

	log.info('Options:')
	log.info(JSON.stringify(options))

	log.info('Initializing backend...')

	const processHandler = new ProcessHandler(log)
	processHandler.init(options)

	const store = new Store()

	let coreConnection: SofieCoreConnection | undefined = undefined
	if (!options.noCore) {
		coreConnection = new SofieCoreConnection(log, options, processHandler, store)
		coreConnection.on('connected', () => {
			log.info('Connected to Core')
		})
		coreConnection.on('disconnected', () => {
			log.warn('Disconnected from Core!')
		})
		await coreConnection.initialized
	} else {
		log.info('NOT connecting to Core (noCore=true)')
	}

	const httpAPI = new ApiServer(log, DEFAULT_DEV_API_PORT, store, coreConnection)

	httpAPI.on('connection', () => {
		log.info('new connection!')
	})

	await httpAPI.initialized

	log.info('Backend initialized')
}
init().catch((err) => {
	log.error(`Error during init`)
	log.error(err)
	log.error(err.stack)
})
