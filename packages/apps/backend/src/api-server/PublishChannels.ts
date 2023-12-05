import { RundownPlaylistId } from '@sofie-prompter-editor/shared-model'

/** Definitions of published channels */
export const PublishChannels = {
	Everyone: (): string => {
		return 'everyone'
	},
	ExampleCategory: (category: string): string => {
		return `example-category/${category}`
	},

	AllPlaylists: (): string => {
		return `playlists`
	},

	/** All info inside one playlist */
	Playlist: (playlistId: RundownPlaylistId): string => {
		return `playlist/${playlistId}`
	},

	RundownsInPlaylist: (playlistId: RundownPlaylistId): string => {
		return `playlist/${playlistId}/rundowns`
	},
}
