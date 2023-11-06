import * as PlaylistServiceDefinition from './PlaylistService.js'
import * as ExampleServiceDefinition from './ExampleService.js'

export { PlaylistServiceDefinition, ExampleServiceDefinition }

export enum Services {
	Example = 'example',
	Playlist = 'playlist',
}
export type ServiceTypes = {
	[Services.Example]: ExampleServiceDefinition.Service
	[Services.Playlist]: PlaylistServiceDefinition.Service
}
