import fs from 'fs'
import { LoggerInstance } from './logger'
import { ConfigOptions } from './config'

// export function setupProcess(config: ProcessConfig): void {}

export class ProcessHandler {
	public certificates: Buffer[] = []
	private log: LoggerInstance

	constructor(log: LoggerInstance) {
		this.log = log.category('ProcessHandler')
	}
	init(processConfig: ConfigOptions): void {
		if (processConfig.unsafeSSL) {
			this.log.info('Disabling NODE_TLS_REJECT_UNAUTHORIZED, be sure to ONLY DO THIS ON A LOCAL NETWORK!')
			process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
		} else {
			// var rootCas = SSLRootCAs.create()
		}
		if (processConfig.certificates.length) {
			this.log.info(`Loading certificates...`)
			for (const certificate of processConfig.certificates) {
				try {
					this.certificates.push(fs.readFileSync(certificate))
					this.log.info(`Using certificate "${certificate}"`)
				} catch (error) {
					this.log.error(`Error loading certificate "${certificate}"`, error)
				}
			}
		}
	}
}
