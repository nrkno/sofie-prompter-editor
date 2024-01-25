import { IReactionDisposer, action, autorun, makeObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { Part, PartId, ScriptContents } from '@sofie-prompter-editor/shared-model'
import { Transformers } from '../sofie-core-connection/dataTransformers/Transformers.js'

import * as Core from '../sofie-core-connection/CoreDataTypes/index.js'

export class PartStore {
	public readonly parts = observable.map<PartId, Part>()

	private readonly _partScripts = observable.map<PartId, ScriptContents>()

	private partAutoruns = new Map<Core.PartId, IReactionDisposer>()

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
								if (!isEqual(this.parts.get(part._id), part)) this._updatePart(partId, part)
							} else {
								if (this.parts.has(partId)) this._removePart(partId)
							}
						})
					)
				}
			}
		})
	}

	updateScript = action((id: PartId, scriptContents: string) => {
		this._partScripts.set(id, scriptContents)

		const part = this.parts.get(id)
		if (!part) throw new Error('Not found')

		this.parts.set(id, {
			...part,
			editedScriptContents: scriptContents,
		})
	})

	private _updatePart = action((partId: PartId, part: Omit<Part, 'editedScriptContents'>) => {
		const partExtended: Part = {
			...part,
			editedScriptContents: this._partScripts.get(partId),
		}

		this.parts.set(partId, partExtended)
	})
	private _removePart = action((partId: PartId) => {
		this.parts.delete(partId)
		this._partScripts.delete(partId)
	})
}
