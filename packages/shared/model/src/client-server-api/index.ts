import * as ExampleServiceDefinition from './ExampleService.js'

import * as SystemStatusServiceDefinition from './SystemStatusService.js'

import * as PlaylistServiceDefinition from './PlaylistService.js'
import * as RundownServiceDefinition from './RundownService.js'
import * as SegmentServiceDefinition from './SegmentService.js'
import * as PartServiceDefinition from './PartService.js'

import * as ControllerServiceDefinition from './ControllerService.js'
import * as OutputSettingsServiceDefinition from './OutputSettingsService.js'
import * as ViewPortServiceDefinition from './ViewPortService.js'

export {
	ExampleServiceDefinition, // todo: remove
	//
	SystemStatusServiceDefinition,
	//
	PlaylistServiceDefinition,
	RundownServiceDefinition,
	SegmentServiceDefinition,
	PartServiceDefinition,
	//
	ControllerServiceDefinition,
	OutputSettingsServiceDefinition,
	ViewPortServiceDefinition,
}

export enum Services {
	Example = 'example',

	SystemStatus = 'systemStatus',

	Playlist = 'playlist',
	Rundown = 'rundown',
	Segment = 'segment',
	Part = 'part',

	Controller = 'controller',
	OutputSettings = 'outputSettings',
	ViewPort = 'viewPort',
}
export type ServiceTypes = {
	[Services.Example]: ExampleServiceDefinition.Service
	[Services.SystemStatus]: SystemStatusServiceDefinition.Service
	[Services.Playlist]: PlaylistServiceDefinition.Service
	[Services.Rundown]: RundownServiceDefinition.Service
	[Services.Segment]: SegmentServiceDefinition.Service
	[Services.Part]: PartServiceDefinition.Service
	[Services.Controller]: ControllerServiceDefinition.Service
	[Services.OutputSettings]: OutputSettingsServiceDefinition.Service
	[Services.ViewPort]: ViewPortServiceDefinition.Service
}
