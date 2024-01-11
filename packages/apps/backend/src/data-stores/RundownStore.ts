import { autorun, observable, IReactionDisposer } from 'mobx'
import isEqual from 'lodash.isequal'
import { Rundown, RundownId } from '@sofie-prompter-editor/shared-model'
import { Transformers } from '../sofie-core-connection/dataTransformers/Transformers.js'
import * as Core from '../sofie-core-connection/CoreDataTypes/index.js'

export class RundownStore {
	public readonly rundowns = observable.map<RundownId, Rundown>()

	private rundownAutoruns = new Map<Core.RundownId, IReactionDisposer>()

	constructor() {
		// makeObservable(this, {
		// 	updateRundown: action,
		// })
	}

	connectTransformers(transformers: Transformers) {
		// Observe and retrieve rundowns from the transformer:
		autorun(() => {
			const coreRundownIds = transformers.rundowns.rundownIds

			const coreRundownIdSet = new Set(coreRundownIds)

			// Removed:
			for (const coreRundownId of this.rundownAutoruns.keys()) {
				if (!coreRundownIdSet.has(coreRundownId)) {
					const disposer = this.rundownAutoruns.get(coreRundownId)
					if (disposer) {
						disposer()
						this.rundownAutoruns.delete(coreRundownId)

						const rundownId = transformers.rundowns.transformRundownId(coreRundownId)
						if (this.rundowns.has(rundownId)) this.rundowns.delete(rundownId)
					}
				}
			}
			// Added:
			for (const coreRundownId of coreRundownIds) {
				if (!this.rundownAutoruns.has(coreRundownId)) {
					this.rundownAutoruns.set(
						coreRundownId,
						autorun(() => {
							const rundown = transformers.rundowns.getTransformedRundown(coreRundownId)
							const rundownId = transformers.rundowns.transformRundownId(coreRundownId)

							if (rundown) {
								if (!isEqual(this.rundowns.get(rundown._id), rundown)) this.rundowns.set(rundownId, rundown)
							} else {
								if (this.rundowns.has(rundownId)) this.rundowns.delete(rundownId)
							}
						})
					)
				}
			}
		})
	}
}
