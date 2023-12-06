import { RundownPlaylistId } from '@sofie-prompter-editor/shared-model'

/** Definitions of published channels */
export const PublishChannels = {
	Everyone: (): string => {
		return 'everyone'
	},
	ExampleCategory: (category: string): string => {
		return `example-category/${category}`
	},

	/** List of RundownPlaylists */
	AllPlaylists: (): string => {
		return `playlists`
	},

	/**
	 * ALL data inside of a RundownPlaylist
	 * Such as
	 * * Rundowns
	 * * Segments
	 * * Parts
	 */
	RundownsInPlaylist: (playlistId: RundownPlaylistId): string => {
		return `playlist/${playlistId}/rundowns`
	},

	/**
	 * Data for the Controller
	 */
	Controller: (): string => {
		return `controller`
	},

	/**
	 * Data for the ViewPort
	 */
	ViewPort: (): string => {
		return `viewport`
	},
}
