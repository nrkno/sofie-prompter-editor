import { CoreConnection, Observer } from '@sofie-automation/server-core-integration'
import { LoggerInstance } from '../../lib/logger.js'
import { Store } from '../../data-stores/Store.js'
import { Transformers } from '../dataTransformers/Transformers.js'

export abstract class DataHandler {
	public abstract initialized: Promise<void>
	protected observers: Array<Observer> = []
	constructor(
		protected log: LoggerInstance,
		protected core: CoreConnection,
		protected store: Store,
		protected transformers: Transformers
	) {}
	destroy() {
		for (const obs of this.observers) {
			obs.stop()
		}
		this.observers = []
	}
}
