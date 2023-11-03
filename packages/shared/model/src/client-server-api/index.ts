import * as PlaylistServiceDefinition from './PlaylistService.js'
export { PlaylistServiceDefinition }

export enum Services {
	Playlist = 'playlist',
	Rundown = 'rundown',
}
export type ServiceTypes = {
	[Services.Playlist]: PlaylistServiceDefinition.Methods
	// [Services.Rundown]: EverythingService
}
export const ClientMethods: ServiceKeyArrays = {
	[Services.Playlist]: ['find', 'get', 'create', 'update', 'patch', 'remove'],
}
export enum PublishChannels {
	Playlists = 'playlists/',
}

type KeyArrays<T> = {
	[K in keyof T]: Array<keyof T[K]>
}
type ServiceKeyArrays = KeyArrays<ServiceTypes>
