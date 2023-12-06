import { ProtectedString } from '../ProtectedString.js'
import { RundownPlaylistId } from './RundownPlaylist.js'
import { DataObject } from './lib.js'

export type RundownId = ProtectedString<'RundownId', string>
/**
 * A Rundown is a part of a RundownPlaylist. It can be considered to be a show, or a part of a show.
 * It contains a list of Segments, which are played back in order.
 * The Rundown is fetched from Core
 */
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
