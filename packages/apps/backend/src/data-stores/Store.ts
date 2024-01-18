import { Transformers } from '../sofie-core-connection/dataTransformers/Transformers.js'
import { PartStore } from './PartStore.js'
import { PlaylistStore } from './PlaylistStore.js'
import { OutputSettingsStore } from './PrompterSettingsStore.js'
import { RundownStore } from './RundownStore.js'
import { SegmentStore } from './SegmentStore.js'
import { ViewPortStore } from './ViewPortStore.js'

export class Store {
	public playlists: PlaylistStore
	public rundowns: RundownStore
	public segments: SegmentStore
	public parts: PartStore

	public viewPort: ViewPortStore
	public prompterSettings: OutputSettingsStore

	constructor() {
		this.playlists = new PlaylistStore()
		this.rundowns = new RundownStore()
		this.segments = new SegmentStore()
		this.parts = new PartStore()

		this.viewPort = new ViewPortStore()
		this.prompterSettings = new OutputSettingsStore()
	}

	connectTransformers(transformers: Transformers) {
		this.rundowns.connectTransformers(transformers)
		this.parts.connectTransformers(transformers)
	}
}
