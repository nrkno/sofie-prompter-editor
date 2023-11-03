import { ProtectedString } from './ProtectedString.js'

export type RundownPlaylistId = ProtectedString<'RundownPlaylistId', string>
export interface RundownPlaylist {
	_id: RundownPlaylistId

	/** Rundown playlist slug - user-presentable name */
	name: string
	created: number
	modified: number

	/** If the playlist is active or not */
	isActive: boolean
	/** Is the playlist in rehearsal mode (can be used, when active: true) */
	rehearsal: boolean
	/** Actual time of playback starting */
	startedPlayback?: number
}

export type RundownId = ProtectedString<'RundownId', string>
export interface Rundown {
	_id: RundownId

	playlistId: RundownPlaylistId
}

export type SegmentId = ProtectedString<'SegmentId', string>
export interface Segment {
	_id: SegmentId
	rundownId: RundownId

	/** User-presentable name (Slug) for the Title */
	name: string

	/** Hide the Segment in the UI */
	isHidden?: boolean

	/** User-facing identifier that can be used by the User to identify the contents of a segment in the Rundown source system */
	identifier?: string
}

export type PartId = ProtectedString<'PartId', string>
export interface Part {
	_id: PartId
	rundownId: RundownId
	segmentId: SegmentId

	/** The story title */
	title: string

	/** User-facing identifier that can be used by the User to identify the contents of a segment in the Rundown source system */
	identifier?: string

	// /** When something bad has happened, we can mark the part as invalid, which will prevent the user from TAKEing it. */
	// invalid?: boolean

	/** Expected duration of the Part, in milliseconds */
	expectedDuration?: number

	/** The type of Part, eg STK, FULL. To be displayed to user */
	displayType: string
}

export type PieceId = ProtectedString<'PieceId', string>
export interface Piece {
	_id: PieceId
	rundownId: RundownId
	partId: PartId

	/** Expected duration of the piece, in milliseconds */
	expectedDuration?: number

	content: SomePieceContent
}
type SomePieceContent = unknown // todo
