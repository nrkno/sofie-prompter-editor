import { PartTransformer } from './PartTransformer.js'
import { RundownTransformer } from './RundownTransformer.js'

export class Transformers {
	public rundowns: RundownTransformer
	public parts: PartTransformer
	constructor() {
		this.rundowns = new RundownTransformer()
		this.parts = new PartTransformer(this)
	}
}
