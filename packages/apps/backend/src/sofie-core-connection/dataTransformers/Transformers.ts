import { PartTransformer } from './PartTransformer.js'
import { RundownTransformer } from './RundownTransformer.js'
import { ExpectedPackageTransformer } from './ExpectedPackageTransformer.js'

export class Transformers {
	public rundowns: RundownTransformer
	public parts: PartTransformer
	public expectedPackages: ExpectedPackageTransformer
	constructor() {
		this.rundowns = new RundownTransformer()
		this.parts = new PartTransformer(this)
		this.expectedPackages = new ExpectedPackageTransformer()
	}
}
