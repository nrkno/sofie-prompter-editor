import { action, makeAutoObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { RundownPlaylist, RundownPlaylistId } from 'packages/shared/model/dist'

export class PlaylistStore {
	public readonly playlists = observable.map<RundownPlaylistId, RundownPlaylist>()

	constructor() {
		makeAutoObservable(this, {
			create: action,
			update: action,
			remove: action,
		})
	}

	create(playlist: RundownPlaylist) {
		this._updateIfChanged(playlist)
	}
	update(playlist: RundownPlaylist) {
		this._updateIfChanged(playlist)
	}
	remove(playlistId: RundownPlaylistId) {
		this._deleteIfChanged(playlistId)
	}

	private _updateIfChanged(playlist: RundownPlaylist) {
		if (!isEqual(this.playlists.get(playlist._id), playlist)) {
			this.playlists.set(playlist._id, playlist)
		}
	}
	private _deleteIfChanged(playlistId: RundownPlaylistId) {
		if (this.playlists.has(playlistId)) {
			this.playlists.delete(playlistId)
		}
	}
}
