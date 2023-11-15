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
}
