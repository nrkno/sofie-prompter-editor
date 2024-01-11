import EventEmitter from 'eventemitter3'

export type BackendConnectionEvents = {
	connected: []
	disconnected: []
}
export class BackendConnection extends EventEmitter<BackendConnectionEvents> {
	
    public readonly playlist: FeathersTypedService<PlaylistServiceDefinition.Service>
    
    constructor() {
		super()
	}

    // playlist = {
	// 	find: async (args?: Query<RundownPlaylist>): Promise<RundownPlaylist[]> => {
	// 		await sleep(500)
	// 		return this._playlists.filter((playlist) => !args || match(playlist, args.query))
	// 	},
	// 	get: async (id: RundownPlaylistId): Promise<RundownPlaylist | undefined> => {
	// 		await sleep(500)
	// 		return this._playlists.find((item) => item._id === id)
	// 	},
	// 	on: (type: EventTypes, fn: Handler) => {
	// 		this.on(`playlist_${type}`, fn)
	// 	},
	// 	off: (type: EventTypes, fn: Handler) => {
	// 		this.off(`playlist_${type}`, fn)
	// 	},
	// }
}
