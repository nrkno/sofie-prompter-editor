import {
	CoreConnection,
	PeripheralDeviceForDevice,
	PeripheralDeviceId,
	protectString,
} from '@sofie-automation/server-core-integration'
import { LoggerInstance, getLogLevel, isLogLevel, setLogLevel } from '../../lib/logger.js'
import { Store } from '../../data-stores/Store.js'
import { DataHandler } from './DataHandler.js'

export class SettingsHandler extends DataHandler {
	public initialized: Promise<void>
	constructor(log: LoggerInstance, core: CoreConnection, store: Store) {
		super(log.category('SettingsHandler'), core, store)

		this.initialized = Promise.resolve().then(async () => {
			await this.core.autoSubscribe('peripheralDeviceForDevice', this.core.deviceId)

			const observer = this.core.observe('peripheralDeviceForDevice')
			observer.added = (id: string) => this.onDeviceChanged(protectString(id))
			observer.changed = (id: string) => this.onDeviceChanged(protectString(id))
			this.observers.push(observer)
		})
	}
	private onDeviceChanged(id: PeripheralDeviceId): void {
		if (id === this.core.deviceId) {
			const collection = this.core.getCollection<PeripheralDeviceForDevice>('peripheralDeviceForDevice')
			if (!collection) {
				this.log.error('collection "peripheralDevices" not found!')
				return
			}

			const device = collection.findOne(id)
			const deviceSettings: any = device?.deviceSettings ?? {} // TODO

			const logLevel = deviceSettings.debugLogging ? 'debug' : 'info'
			if (logLevel !== getLogLevel() && isLogLevel(logLevel)) {
				setLogLevel(logLevel)
			}
		}
	}
}
