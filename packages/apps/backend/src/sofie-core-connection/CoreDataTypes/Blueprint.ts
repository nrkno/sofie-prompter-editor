import {
	BlueprintManifestType,
	IBlueprintConfig,
	IStudioConfigPreset,
	IShowStyleConfigPreset,
} from '@sofie-automation/blueprints-integration'
import { JSONBlob } from '@sofie-automation/shared-lib/dist/lib/JSONBlob'
import { JSONSchema } from '@sofie-automation/shared-lib/dist/lib/JSONSchemaTypes'
import { ProtectedString } from '@sofie-automation/server-core-integration'
import { BlueprintId, OrganizationId } from './Ids'

export type BlueprintHash = ProtectedString<'BlueprintHash'>

export interface Blueprint {
	_id: BlueprintId
	organizationId: OrganizationId | null
	name: string
	/** String containing the Code for the blueprint */
	code: string
	/** Whether the blueprint has a code or not. Is equal to !!blueprint.code. */
	hasCode: boolean
	/** Timestamp, last time the blueprint was modified */
	modified: number
	/** Timestamp, when the blueprint was created */
	created: number

	/**
	 * Blueprint author defined unique id for this blueprint
	 * This could be the same for multiple blueprints in the system
	 */
	blueprintId: string
	blueprintType?: BlueprintManifestType

	studioConfigSchema?: JSONBlob<JSONSchema>
	showStyleConfigSchema?: JSONBlob<JSONSchema>

	studioConfigPresets?: Record<string, IStudioConfigPreset>
	showStyleConfigPresets?: Record<string, IShowStyleConfigPreset>

	databaseVersion: {
		showStyle: {
			[showStyleBaseId: string]: string
		}
		studio: {
			[studioId: string]: string
		}
		system: string | undefined
	}

	blueprintVersion: string
	integrationVersion: string
	TSRVersion: string
	/** Whether version checks should be disabled for this version */
	disableVersionChecks?: boolean

	/** Hash for the blueprint, changed each time it is changed */
	blueprintHash: BlueprintHash
}

/** Describes the last state a Blueprint document was in when applying config changes */
export interface LastBlueprintConfig {
	blueprintId: BlueprintId
	blueprintHash: BlueprintHash
	blueprintConfigPresetId: string

	config: IBlueprintConfig
}
