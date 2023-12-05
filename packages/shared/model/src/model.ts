import { AnyProtectedString, ProtectedString } from './ProtectedString.js'

/*
 These types are shared between the server and the client
*/

export interface DataObject {
	_id: AnyProtectedString
}

export type RundownPlaylistId = ProtectedString<'RundownPlaylistId', string>
export interface RundownPlaylist extends DataObject {
	_id: RundownPlaylistId

	/** Rundown playlist slug - user-presentable name */
	label: string
	created: number
	modified: number

	/** Is false while data is being loaded from Core */
	loaded: boolean

	/** If the playlist is active or not */
	isActive: boolean
	/** Is the playlist in rehearsal mode (can be used, when active: true) */
	rehearsal: boolean
	/** Actual time of playback starting */
	startedPlayback: number | undefined

	// To be implemented later:
	// timing: {
	// 	expectedStart?: number
	// 	expectedEnd?: number
	// 	expectedDuration?: number
	// 	startedPlayback?: number
	// }
}

export type RundownId = ProtectedString<'RundownId', string>
export interface Rundown extends DataObject {
	_id: RundownId

	playlistId: RundownPlaylistId

	/** User-presentable name (Slug) for the Title */
	label: string

	/** The position of the Rundown within its Playlist */
	rank: number

	// To be implemented later:
	// timing: {
	// 	expectedStart?: number
	// 	expectedEnd?: number
	// 	expectedDuration?: number
	// 	startedPlayback?: number
	// }
}

export type SegmentId = ProtectedString<'SegmentId', string>
export interface Segment extends DataObject {
	_id: SegmentId
	playlistId: RundownPlaylistId
	rundownId: RundownId

	/** The position of the Segment within its Rundown */
	rank: number

	/** User-presentable name (Slug) for the Title */
	label: string

	/** Hide the Segment in the UI */
	isHidden?: boolean

	// To be implemented later:
	/** User-facing identifier that can be used by the User to identify the contents of a segment in the Rundown source system */
	// identifier?: string

	timing?: {
		expectedStart?: number
		expectedEnd?: number
		budgetDuration?: number
	}
}

export type PartId = ProtectedString<'PartId', string>
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

	// /** When something bad has happened, we can mark the part as invalid, which will prevent the user from TAKEing it. */
	// invalid?: boolean

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
}
export enum PartDisplayType {
	KAM,
	FULL,
	STK,
	SPL,
	DIR,
}

/** Stored as markdown */
export type ScriptContents = string

/** TBD, something used to mark places in ScriptContents */
export type TextMarkerId = ProtectedString<'TextMarkerId', string>

/** Represents a view of the prompter, is streamed from the viewPort. This is always the last connected viewport. */
export interface ViewPort {
	_id: 'viewport'

	/**
	 * When a ViewPort starts up, it randomizes its instanceId and sends it to the Server.
	 * If the ViewPorts' instanceId is the "last one" it is in control.
	 * The ViewPort "in control" will stream its data to the server continuously.
	 * If a ViewPort is not "in control" it could listen to the ViewPort data and jump to the same position to stay in sync.
	 */
	instanceId: string

	/** The width of the viewport (as percentage of viewport height) */
	width: number

	/** Current position of the viewport */
	position: ViewPortPosition
}

/** Set by a user */
export interface PrompterSettings {
	fontSize: number // in percentage of viewport height

	mirrorHorizontally: boolean
	mirrorVertically: boolean

	focusPosition: 'start' | 'center' | 'end'
	showFocusPosition: boolean

	/** Adds padding between the edge of the screen and the text */
	marginHorizontal: number
	/** In percentage of viewport height */
	marginVertical: number
}

/** Sent from the user control interface to the ViewPort */
export type ControllerMessage = {
	speed: number // unit (lines per second)?
	/** If set, viewport should jump to that position  */
	position?: ViewPortPosition
}

/** Defines a position of the viewport */
export interface ViewPortPosition {
	/**
	 * The Part which the current offset is calculated from.
	 * `null` means "top of page"
	 */
	scrollOffsetTarget: SegmentId | PartId | TextMarkerId | null
	/** The position of the ViewPort  */
	scrollOffset: number
}
