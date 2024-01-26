import { IReactionDisposer, action, autorun, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { Part, PartId, ScriptContents } from '@sofie-prompter-editor/shared-model'
import { Transformers } from '../sofie-core-connection/dataTransformers/Transformers.js'

import * as Core from '../sofie-core-connection/CoreDataTypes/index.js'

export class PartStore {
	public readonly parts = observable.map<PartId, Part>()

	/**
	 * This is not observable, as it is internal and reactivity is handled manually when updating this Map
	 */
	private readonly _partScripts = new Map<PartId, ScriptContents>()

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
								const oldPart = this.parts.get(partId)
								const hasScriptChanged = oldPart && !isEqual(oldPart.scriptContents, part.scriptContents)
								if (hasScriptChanged) {
									// Discard the edited script whenever the original script changes
									this._partScripts.delete(partId)
								}

								const fullPart: Part = {
									...part,
									editedScriptContents: this._partScripts.get(partId),
								}

								if (hasScriptChanged || !isEqual(this.parts.get(part._id), fullPart)) this._updatePart(partId, fullPart)
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

	private _updatePart = action((partId: PartId, part: Part) => {
		this.parts.set(partId, part)
	})
	private _removePart = action((partId: PartId) => {
		this.parts.delete(partId)
		this._partScripts.delete(partId)
	})
}
