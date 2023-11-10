import { makeAutoObservable, observable, action } from 'mobx'
import { RundownPlaylistId } from 'packages/shared/model/dist'
import { AppStore } from './AppStore'
import { APIConnection } from '../api/ApiConnection'
import { UIRundown } from '../model/UIRundown'
import { UIRundownEntry } from '../model/UIRundownEntry'

export class RundownStore {
	showingOnlyScripts = false

	allRundowns = observable.array<UIRundownEntry>()
	openRundown: UIRundown | null = null

	constructor(public appStore: AppStore, public connection: APIConnection) {
		makeAutoObservable(this, {})

		// get all rundowns
		this.connection.playlist.on('created', () => {})
		this.loadAllRudnowns()
	}

	loadAllRudnowns() {
		this.connection.playlist.find().then(
			action('receiveRundowns', () => {
				// add UIRundownEntries to allRundowns
			})
		)
	}

	loadRundown(id: RundownPlaylistId) {
		console.log(id)
		// get a full rundown from backend and create a UIRundown object
		// assign to openRundown
	}
}
