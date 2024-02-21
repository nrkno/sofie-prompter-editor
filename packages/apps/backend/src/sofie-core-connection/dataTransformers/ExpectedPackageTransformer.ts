import { action, computed, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import {
	AnyProtectedString,
	ExpectedPackageId,
	PartId,
	PartScriptPackageInfo,
	ScriptContents,
} from '@sofie-prompter-editor/shared-model'
import * as Core from '../CoreDataTypes/index.js'
import { computedFn } from 'mobx-utils'
import { popElementFromReactiveArray, upsertElementToReactiveArray } from './util.js'
import { ScriptPackageInfoPayload } from '../SofieCoreConnection.js'

export interface ExpectedScriptWithInfo {
	_id: PartId

	/** Script from Core (ie original from the NRCS) */
	scriptContents: ScriptContents
	/** Editied script from Core */
	editedScriptContents: ScriptContents | undefined
	/** The expectedPackage id from Core, and the version hash which changes whenever the scriptContents changes (done by the Core Blueprints) */
	scriptPackageInfo: PartScriptPackageInfo
}

export class ExpectedPackageTransformer {
	private readonly coreScriptPackagesForPart = observable.map<Core.PartId, Core.ExpectedPackageDBFromPiece[]>()

	private readonly coreExpectedScriptPackages = observable.map<
		Core.ExpectedPackageId,
		Core.ExpectedPackageDBFromPiece
	>()
	private readonly corePackageInfos = observable.map<Core.PackageInfoId, Core.PackageInfoDB>()

	@computed
	public get partIds(): Core.PartId[] {
		return Array.from(this.coreScriptPackagesForPart.keys())
	}
	public transformPartId(id: Core.PartId): PartId {
		return this.convertId<Core.PartId, PartId>(id)
	}

	public getTransformedScriptForPart = computedFn((corePartId: Core.PartId): ExpectedScriptWithInfo | undefined => {
		const coreExpectedPackages = this.coreScriptPackagesForPart.get(corePartId)
		const coreScriptPackage = coreExpectedPackages?.find((c) => c.type === Core.PROMPTER_EXPECTED_PACKAGE_TYPE)
		if (!coreScriptPackage) return undefined

		const result: ExpectedScriptWithInfo = {
			_id: this.convertId<Core.PartId, PartId>(corePartId),

			// @ts-expect-error Not typed
			scriptContents: coreScriptPackage.content.originalScript,
			editedScriptContents: undefined, // coreScriptPackage.content.modifiedScript,
			scriptPackageInfo: {
				packageId: this.convertId<Core.ExpectedPackageId, ExpectedPackageId>(coreScriptPackage._id),
				contentVersionHash: coreScriptPackage.contentVersionHash,
			},
		}

		const packageInfoId = Core.getPackageInfoId(coreScriptPackage._id, Core.PROMPTER_PACKAGE_INFO_TYPE)
		const corePackageInfo = this.corePackageInfos.get(packageInfoId)
		if (corePackageInfo?.expectedContentVersionHash === coreScriptPackage.contentVersionHash) {
			// If the package hash and the info hash matches, the info can be used.
			// This means that Core has an edited script stored and that it is recent. Use that:
			const payload = corePackageInfo.payload as ScriptPackageInfoPayload

			result.editedScriptContents = payload.modifiedScriptMarkdown
		} else {
			// can't use the info
			// ignore any packageinfo, as the original script has changed
		}

		return result
	})

	/** This is called whenever the data from Core changes */
	updateCoreExpectedPackage = action(
		(id: Core.ExpectedPackageId, expectedPackage: Core.ExpectedPackageDB | undefined) => {
			if (expectedPackage && expectedPackage.fromPieceType === Core.ExpectedPackageDBType.PIECE) {
				if (!isEqual(this.coreExpectedScriptPackages.get(id), expectedPackage)) {
					this.coreExpectedScriptPackages.set(id, expectedPackage)

					// create a new array so that the observable.map will pick up on the change
					upsertElementToReactiveArray(this.coreScriptPackagesForPart, expectedPackage.partId, expectedPackage)
				}
			} else {
				const existingPackage = this.coreExpectedScriptPackages.get(id)
				if (existingPackage) {
					this.coreExpectedScriptPackages.delete(id)

					// create a new array so that the observable.map will pick up on the change
					popElementFromReactiveArray(this.coreScriptPackagesForPart, existingPackage.partId, existingPackage._id)
				}
			}
		}
	)

	/** This is called whenever the data from Core changes */
	updateCoreScriptPackageInfo = action((id: Core.PackageInfoId, packageInfo: Core.PackageInfoDB | undefined) => {
		if (packageInfo) {
			if (!isEqual(this.corePackageInfos.get(id), packageInfo)) {
				this.corePackageInfos.set(id, packageInfo)
			}
		} else {
			this.corePackageInfos.delete(id)
		}
	})

	private convertId<B extends AnyProtectedString, A extends Core.ProtectedString<any>>(id: B): A
	private convertId<A extends Core.ProtectedString<any>, B extends AnyProtectedString>(id: A): B
	private convertId<A, B>(id: A): B {
		return id as any
	}
}
