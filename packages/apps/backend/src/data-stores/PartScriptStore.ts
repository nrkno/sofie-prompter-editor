import { IReactionDisposer, action, autorun, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { PartId } from '@sofie-prompter-editor/shared-model'
import { Transformers } from '../sofie-core-connection/dataTransformers/Transformers.js'
import * as Core from '../sofie-core-connection/CoreDataTypes/index.js'
import { ExpectedScriptWithInfo } from '../sofie-core-connection/dataTransformers/ExpectedPackageTransformer.js'

interface LocalScriptEdit {
	editedScriptContents: string
	// The revision number this was based off
	replacesContentHash: string
}

export class PartScriptStore {
	public readonly partScripts = observable.map<PartId, ExpectedScriptWithInfo>()

	// TODO - should we ever delete these after persisting in a packaeg info?
	private readonly localScriptEdits = new Map<PartId, LocalScriptEdit>()

	private partScriptAutoruns = new Map<Core.PartId, IReactionDisposer>()

	connectTransformers(transformers: Transformers) {
		// Observe and retrieve parts from the transformer:
		autorun(() => {
			const corePartIds = transformers.expectedPackages.partIds

			const corePartIdSet = new Set(corePartIds)

			// Removed:
			for (const corePartId of this.partScriptAutoruns.keys()) {
				if (!corePartIdSet.has(corePartId)) {
					const disposer = this.partScriptAutoruns.get(corePartId)
					if (disposer) {
						disposer()
						this.partScriptAutoruns.delete(corePartId)

						const partId = transformers.expectedPackages.transformPartId(corePartId)
						if (this.partScripts.has(partId)) this.partScripts.delete(partId)
					}
				}
			}
			// Added:
			for (const corePartId of corePartIds) {
				if (!this.partScriptAutoruns.has(corePartId)) {
					this.partScriptAutoruns.set(
						corePartId,
						autorun(() => {
							let partScript = transformers.expectedPackages.getTransformedScriptForPart(corePartId)
							const partId = transformers.expectedPackages.transformPartId(corePartId)

							if (partScript) {
								// If there is a local script which replaces the Core one
								const localScript = this.localScriptEdits.get(partId)
								if (
									localScript &&
									localScript.replacesContentHash === partScript.scriptPackageInfo.contentVersionHash
								) {
									// using local script
									partScript = {
										...partScript,
										editedScriptContents: localScript.editedScriptContents,
									}
								}

								if (!isEqual(this.partScripts.get(partScript._id), partScript))
									this._updatePartScript(partId, partScript)
							} else {
								if (this.partScripts.has(partId)) this._removePartScript(partId)
							}
						})
					)
				}
			}
		})
	}

	/**
	 * User has made a script edit
	 */
	updateScript = action((id: PartId, scriptContents: string) => {
		const partScript = this.partScripts.get(id)
		if (!partScript) throw new Error('Not found')

		// Store the local change for future part updates
		this.localScriptEdits.set(id, {
			editedScriptContents: scriptContents,
			replacesContentHash: partScript.scriptPackageInfo.contentVersionHash, // TODO - should this be passed from the frontend too? If so, it will need to be compared instead
		})

		// Update the partScript to be propogated to consumers
		this.partScripts.set(id, {
			...partScript,
			editedScriptContents: scriptContents,
		})
	})

	private _updatePartScript = action((partId: PartId, partScript: ExpectedScriptWithInfo) => {
		this.partScripts.set(partId, partScript)
	})
	private _removePartScript = action((partId: PartId) => {
		this.partScripts.delete(partId)
		this.localScriptEdits.delete(partId)
	})
}
