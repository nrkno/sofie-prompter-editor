import { IReactionDisposer, autorun, observable, observe } from 'mobx'
import isEqual from 'lodash.isequal'
import { Part, PartId } from '@sofie-prompter-editor/shared-model'
import { Transformers } from '../sofie-core-connection/dataTransformers/Transformers.js'
import { assertNever } from '@sofie-prompter-editor/shared-lib'

import * as Core from '../sofie-core-connection/CoreDataTypes/index.js'

export class PartStore {
	public readonly parts = observable.map<PartId, Part>()

	private partAutoruns = new Map<Core.PartId, IReactionDisposer>()

	constructor() {
		// makeAutoObservable(this, {
		// 	updatePart: action,
		// 	removePart: action,
		// })
	}
	connectTransformers(transformers: Transformers) {
		// Observe and retrieve parts from the transformer:
		observe(transformers.parts.partIds, (change) => {
			if (change.type === 'add') {
				const corePartId = change.newValue

				if (!this.partAutoruns.has(corePartId)) {
					this.partAutoruns.set(
						corePartId,
						autorun(() => {
							const part = transformers.parts.getTransformedPart(corePartId)
							const partId = transformers.parts.transformPartId(corePartId)

							if (part) {
								if (!isEqual(this.parts.get(part._id), part)) this.parts.set(partId, part)
							} else {
								if (this.parts.has(partId)) this.parts.delete(partId)
							}
						})
					)
				}
			} else if (change.type === 'delete') {
				const corePartId = change.oldValue

				const disposer = this.partAutoruns.get(corePartId)
				if (disposer) {
					disposer()
					this.partAutoruns.delete(corePartId)

					const partId = transformers.parts.transformPartId(corePartId)
					if (this.parts.has(partId)) this.parts.delete(partId)
				}
			} else assertNever(change)
		})
	}
}
