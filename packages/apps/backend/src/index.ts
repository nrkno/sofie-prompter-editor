import { DEFAULT_DEV_API_PORT } from '@sofie-prompter-editor/shared-lib'
import { ApiServer } from './api-server/ApiServer.js'
import { initializeLogger, setupLogger } from './lib/logger.js'

const loggerConfig = {}

initializeLogger(loggerConfig)
const logger = setupLogger(loggerConfig, 'backend')

async function init() {
	logger.info('Initializing backend...')

	const httpAPI = new ApiServer(logger, DEFAULT_DEV_API_PORT)

	httpAPI.on('connection', () => {
		logger.info('new connection!')
	})

	await httpAPI.initialized

	logger.info('Backend initialized')
}
init().catch(logger.error)
