import { ApiServer } from './api-server/ApiServer.js'
import { initializeLogger, setupLogger } from './lib/logger.js'

const loggerContig = {}

initializeLogger(loggerContig)
const logger = setupLogger(loggerContig, 'backend')

async function init() {
	logger.info('Initializing backend...')

	const API_PORT = 5500

	const httpAPI = new ApiServer(logger, API_PORT)

	httpAPI.on('connection', () => {
		logger.debug('new connection!')
	})

	await httpAPI.initialized

	logger.info('Backend initialized')
}
init().catch(logger.error)
