import { ProtectedString } from '../ProtectedString.js'
import { DataObject } from './lib.js'

export type RundownPlaylistId = ProtectedString<'RundownPlaylistId', string>
/**
 * A RundownPlaylist is equivalent to a "show" or a "program" to be played out in Sofie.
 * It contains a list of Rundowns, which are played back in order.
 * The RundownPlaylist is fetched from Core
 */
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
