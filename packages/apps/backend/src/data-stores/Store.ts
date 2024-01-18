import { Transformers } from '../sofie-core-connection/dataTransformers/Transformers.js'
import { PartStore } from './PartStore.js'
import { PlaylistStore } from './PlaylistStore.js'
import { OutputSettingsStore } from './OutputSettingsStore.js'
import { RundownStore } from './RundownStore.js'
import { SegmentStore } from './SegmentStore.js'
import { ViewPortStore } from './ViewPortStore.js'
import { ControllerStore } from './ControllerStore.js'
import { SystemStatusStore } from './SystemStatusStore.js'

export class Store {
	public systemStatus: SystemStatusStore

	public playlists: PlaylistStore
	public rundowns: RundownStore
	public segments: SegmentStore
	public parts: PartStore

	public controller: ControllerStore
	public viewPort: ViewPortStore
	public outputSettings: OutputSettingsStore

	constructor() {
		this.systemStatus = new SystemStatusStore()
		this.playlists = new PlaylistStore()
		this.rundowns = new RundownStore()
		this.segments = new SegmentStore()
		this.parts = new PartStore()

		this.controller = new ControllerStore()
		this.viewPort = new ViewPortStore()
		this.outputSettings = new OutputSettingsStore()
	}

	connectTransformers(transformers: Transformers) {
		this.rundowns.connectTransformers(transformers)
		this.parts.connectTransformers(transformers)
	}
}
