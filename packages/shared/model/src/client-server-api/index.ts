import * as ExampleServiceDefinition from './ExampleService.js'

import * as PlaylistServiceDefinition from './PlaylistService.js'
import * as RundownServiceDefinition from './RundownService.js'
import * as SegmentServiceDefinition from './SegmentService.js'
import * as PartServiceDefinition from './PartService.js'

import * as PrompterSettingsServiceDefinition from './PrompterSettingsService.js'
import * as ViewPortServiceDefinition from './ViewPortService.js'

export {
	ExampleServiceDefinition,
	//
	PlaylistServiceDefinition,
	RundownServiceDefinition,
	SegmentServiceDefinition,
	PartServiceDefinition,
	//
	PrompterSettingsServiceDefinition,
	ViewPortServiceDefinition,
}

export enum Services {
	Example = 'example',

	Playlist = 'playlist',
	Rundown = 'rundown',
	Segment = 'segment',
	Part = 'part',

	PrompterSettings = 'prompterSettings',
	ViewPort = 'viewPort',
}
export type ServiceTypes = {
	[Services.Example]: ExampleServiceDefinition.Service
	[Services.Playlist]: PlaylistServiceDefinition.Service
	[Services.Rundown]: RundownServiceDefinition.Service
	[Services.Segment]: SegmentServiceDefinition.Service
	[Services.Part]: PartServiceDefinition.Service
	[Services.PrompterSettings]: PrompterSettingsServiceDefinition.Service
	[Services.ViewPort]: ViewPortServiceDefinition.Service
}
