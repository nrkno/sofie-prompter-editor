import { action, makeAutoObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { OutputSettings } from '@sofie-prompter-editor/shared-model'

export class OutputSettingsStore {
	public outputSettings = observable.box<OutputSettings>({
		// _id: '',

		// TODO: load these from persistent store upon startup?
		fontSize: 7,

		mirrorHorizontally: false,
		mirrorVertically: false,

		focusPosition: 'center',
		showFocusPosition: false,

		marginHorizontal: 1,
		marginVertical: 1,

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
	patch(partialData: Partial<OutputSettings>) {
		const data = { ...this.outputSettings.get(), ...partialData }
		this._updateIfChanged(data)
	}

	private _updateIfChanged(outputSettings: OutputSettings) {
		if (!isEqual(this.outputSettings.get(), outputSettings)) {
			this.outputSettings.set(outputSettings)
		}
	}
}
