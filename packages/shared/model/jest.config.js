import base from '../../../jest.config.base.js'
import packageJson from './package.json' assert { type: "json" }

export default {
	...base,
	displayName: packageJson.name,
}
