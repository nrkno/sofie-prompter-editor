import { ProtectedString } from '../ProtectedString.js'
import { RundownId } from './Rundown.js'
import { RundownPlaylistId } from './RundownPlaylist.js'
import { SegmentId } from './Segment.js'
import { DataObject } from './lib.js'

export type PartId = ProtectedString<'PartId', string>
/**
 * A Part is a part of a Segment. When a user does a "Take" in Sofie, the next Part is being put on air.
 * The Part is fetched from Core
 */
export interface Part extends DataObject {
	_id: PartId
	playlistId: RundownPlaylistId
	rundownId: RundownId
	segmentId: SegmentId
	/** The position of the Part within its Segment */
	rank: number

	isOnAir: boolean
	isNext: boolean

	/** The story title/slug, displayable to user */
	label: string

	/** An alternative override to show in the rendered prompter output */
	prompterLabel?: string

	/** User-facing identifier that can be used by the User to identify the contents of a segment in the Rundown source system */
	identifier?: string

	/** When something bad has happened, we can mark the part as invalid, which will prevent the user from TAKEing it. */
	invalid?: boolean

	/** Expected duration of the Part, in milliseconds */
	expectedDuration?: number

	/** Is true if the Part has been updated since user last saw it. User can acknowledge*/
	isNew?: boolean

	/** The type of Part, eg STK, FULL. */
	display: {
		/** Styling information (colors, etc.) */
		type: PartDisplayType // ie sourceLayer.type in Sofie
		/** Label to be displayed to user */
		label: string // ie sourceLayer.name in Sofie
	}

	scriptContents?: ScriptContents
	editedScriptContents?: ScriptContents
}

export enum PartDisplayType {
	Camera = 'camera',
	VT = 'vt',
	LiveSpeak = 'liveSpeak',
	Split = 'split',
	Remote = 'remote',

	Other = 'other',

	Unknown = 'unknown',
}

/** Stored as markdown */
export type ScriptContents = string
