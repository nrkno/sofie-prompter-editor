import { action, makeAutoObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { OutputSettings } from '@sofie-prompter-editor/shared-model'

export class OutputSettingsStore {
	public prompterSettings = observable.box<OutputSettings>({
		_id: '',

		// TODO: load these from persistent store upon startup?
		fontSize: 10,

		mirrorHorizontally: false,
		mirrorVertically: false,

		focusPosition: 'center',
		showFocusPosition: false,

		marginHorizontal: 5,
		marginVertical: 5,

		activeRundownPlaylistId: null,
	})

	constructor() {
		makeAutoObservable(this, {
			create: action,
			update: action,
		})
	}

	create(data: OutputSettings) {
		this._updateIfChanged(data)
	}
	update(data: OutputSettings) {
		this._updateIfChanged(data)
	}

	private _updateIfChanged(prompterSettings: OutputSettings) {
		if (!isEqual(this.prompterSettings.get(), prompterSettings)) {
			this.prompterSettings.set(prompterSettings)
		}
	}
}
