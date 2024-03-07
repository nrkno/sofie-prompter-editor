import { IReactionDisposer, action, autorun, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { Part, PartId } from '@sofie-prompter-editor/shared-model'
import { Transformers } from '../sofie-core-connection/dataTransformers/Transformers.js'

import * as Core from '../sofie-core-connection/CoreDataTypes/index.js'
import { PartScriptStore } from './PartScriptStore.js'

export class PartStore {
	public readonly parts = observable.map<PartId, Part>()

	private partAutoruns = new Map<Core.PartId, IReactionDisposer>()

	constructor(private readonly partScripts: PartScriptStore) {}

	connectTransformers(transformers: Transformers) {
		// Observe and retrieve parts from the transformer:
		autorun(() => {
			const corePartIds = transformers.parts.partIds

			const corePartIdSet = new Set(corePartIds)

			// Removed:
			for (const corePartId of this.partAutoruns.keys()) {
				if (!corePartIdSet.has(corePartId)) {
					const disposer = this.partAutoruns.get(corePartId)
					if (disposer) {
						disposer()
						this.partAutoruns.delete(corePartId)

						const partId = transformers.parts.transformPartId(corePartId)
						if (this.parts.has(partId)) this.parts.delete(partId)
					}
				}
			}
			// Added:
			for (const corePartId of corePartIds) {
				if (!this.partAutoruns.has(corePartId)) {
					this.partAutoruns.set(
						corePartId,
						autorun(() => {
							const part = transformers.parts.getTransformedPart(corePartId)
							const partId = transformers.parts.transformPartId(corePartId)

							if (part) {
								const partScript = this.partScripts.partScripts.get(partId)

								const fullPart: Part = { ...part }
								if (partScript) {
									fullPart.scriptContents = partScript.scriptContents
									fullPart.editedScriptContents = partScript.editedScriptContents
									fullPart.scriptPackageInfo = partScript.scriptPackageInfo
								}

								if (!isEqual(this.parts.get(part._id), fullPart)) this._updatePart(partId, fullPart)
							} else {
								if (this.parts.has(partId)) this._removePart(partId)
							}
						})
					)
				}
			}
		})
	}

	private _updatePart = action((partId: PartId, part: Part) => {
		this.parts.set(partId, part)
	})
	private _removePart = action((partId: PartId) => {
		this.parts.delete(partId)
	})
}
