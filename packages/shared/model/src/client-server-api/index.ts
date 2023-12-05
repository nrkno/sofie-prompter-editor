import * as PlaylistServiceDefinition from './PlaylistService.js'
import * as RundownServiceDefinition from './RundownService.js'
import * as SegmentServiceDefinition from './SegmentService.js'
import * as PartServiceDefinition from './PartService.js'
import * as ExampleServiceDefinition from './ExampleService.js'

export {
	PlaylistServiceDefinition,
	ExampleServiceDefinition,
	RundownServiceDefinition,
	SegmentServiceDefinition,
	PartServiceDefinition,
}

export enum Services {
	Example = 'example',
	Playlist = 'playlist',
	Rundown = 'rundown',
	Segment = 'segment',
	Part = 'part',
}
export type ServiceTypes = {
	[Services.Example]: ExampleServiceDefinition.Service
	[Services.Playlist]: PlaylistServiceDefinition.Service
	[Services.Rundown]: RundownServiceDefinition.Service
	[Services.Segment]: SegmentServiceDefinition.Service
	[Services.Part]: PartServiceDefinition.Service
}
