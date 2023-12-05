import { PartStore } from './PartStore.js'
import { PlaylistStore } from './PlaylistStore.js'
import { RundownStore } from './RundownStore.js'
import { SegmentStore } from './SegmentStore.js'

export class Store {
	public playlists = new PlaylistStore()
	public rundowns = new RundownStore()
	public segments = new SegmentStore()
	public parts = new PartStore()
}
