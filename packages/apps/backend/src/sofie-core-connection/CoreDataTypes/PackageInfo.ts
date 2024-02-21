import type { ExpectedPackage, PackageInfo, Time } from '@sofie-automation/blueprints-integration'
import type { ExpectedPackageDB } from './ExpectedPackage'
import type { ExpectedPackageId, PackageInfoId, PeripheralDeviceId, StudioId } from './Ids'
import { protectString } from '@sofie-automation/server-core-integration'

export const PROMPTER_PACKAGE_INFO_TYPE = 'custom-prompter-editor-script' as PackageInfo.Type
export const PROMPTER_EXPECTED_PACKAGE_TYPE = 'custom-prompter-editor-script' as ExpectedPackage.PackageType

/**
 * The PackageInfos collection contains information related to Packages.
 * This collection is populated from a Package Manager-device.
 */

export interface PackageInfoDB extends PackageInfo.Base {
	_id: PackageInfoId

	/** Reference to the Package this document has info about */
	packageId: ExpectedPackageId
	/** Reference to the contentVersionHash of the ExpectedPackage, used to reference the expected content+version of the Package */
	expectedContentVersionHash: ExpectedPackageDB['contentVersionHash']
	/** Referring to the actual contentVersionHash of the Package, used to reference the exact content+version of the Package */
	actualContentVersionHash: string

	/** The studio this Package is in */
	studioId: StudioId

	/** Which PeripheralDevice this info comes from */
	deviceId: PeripheralDeviceId

	type: PackageInfo.Type
	payload: any

	/** If set, the package is invalid and will be removed after this time (unix timestamp) */
	removeTime?: Time | null
}

export function getPackageInfoId(packageId: ExpectedPackageId, type: string): PackageInfoId {
	return protectString(`${packageId}_${type}`)
}
