import { ProtectedString } from '../ProtectedString.js'
import { RundownId } from './Rundown.js'
import { RundownPlaylistId } from './RundownPlaylist.js'
import { DataObject } from './lib.js'

export type SegmentId = ProtectedString<'SegmentId', string>
/**
 * A Segment is a part of a Rundown. It can be considered to be a "topic" in a show.
 * It contains a list of Parts, which are played back in order.
 * The Segment is fetched from Core
 */
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
