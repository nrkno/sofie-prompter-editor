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
	 * Data for ControllerMessages
	 */
	ControllerMessages: (): string => {
		return `controller-messages`
	},

	/**
	 * Data for OutputSettings
	 */
	OutputSettings: (): string => {
		return `output-settings`
	},

	/**
	 * Data from the ViewPort
	 */
	ViewPort: (): string => {
		return `viewport`
	},

	/**
	 * Data for the SystemStatus
	 */
	SystemStatus: (): string => {
		return `system-status`
	},
}
