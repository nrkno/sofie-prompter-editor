import { Options } from 'yargs'
import yargs from 'yargs/yargs'

/*
 * This file contains various CLI argument definitions, used by the various processes that together constitutes the Package Manager
 */

/** Generic CLI-argument-definitions for any process */
const optionsDefinition = defineArguments({
	logLevel: { type: 'string', describe: 'Set default log level. (Might be overwritten by Sofie Core)' },

	unsafeSSL: {
		type: 'boolean',
		default: process.env.UNSAFE_SSL === '1',
		describe: 'Set to true to allow all SSL certificates (only use this in a safe, local environment)',
	},
	certificates: { type: 'string', describe: 'SSL Certificates' },

	noCore: {
		type: 'boolean',
		default: process.env.NO_CORE === '1',
		describe: 'If true, Package Manager wont try to connect to Sofie Core',
	},
	coreHost: {
		type: 'string',
		default: process.env.CORE_HOST || '127.0.0.1',
		describe: 'The IP-address/hostName to Sofie Core',
	},
	corePort: {
		type: 'number',
		default: parseInt(process.env.CORE_PORT || '', 10) || 3000,
		describe: 'The port number of Sofie core (usually 80, 443 or 3000)',
	},

	deviceId: {
		type: 'string',
		default: process.env.DEVICE_ID || '',
		describe: '(Optional) Unique device id of this device',
	},
	deviceToken: {
		type: 'string',
		default: process.env.DEVICE_TOKEN || '',
		describe: '(Optional) access token of this device.',
	},
})

export interface ConfigOptions {
	logLevel: string | undefined
	/** Will cause the Node app to blindly accept all certificates. Not recommenced unless in local, controlled networks. */
	unsafeSSL: boolean
	/** Paths to certificates to load, for SSL-connections */
	certificates: string[]

	noCore: boolean
	coreHost: string
	corePort: number
	deviceId: string
	deviceToken: string
}
export async function getConfigOptions(): Promise<ConfigOptions> {
	const argv = await Promise.resolve(yargs(process.argv.slice(2)).options(optionsDefinition).argv)

	return {
		logLevel: argv.logLevel,
		unsafeSSL: argv.unsafeSSL,
		certificates: ((argv.certificates || process.env.CERTIFICATES || '').split(';') || []).filter(Boolean),

		noCore: argv.noCore,
		coreHost: argv.coreHost,
		corePort: argv.corePort,
		deviceId: argv.deviceId,
		deviceToken: argv.deviceToken,
	}
}

// ---------------------------------------------------------------------------------

/** Helper function, to get strict typings for the yargs-Options. */
function defineArguments<O extends { [key: string]: Options }>(opts: O): O {
	return opts
}
