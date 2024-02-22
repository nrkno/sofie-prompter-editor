import { action, makeAutoObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { OutputSettings, OutputSettingsSchema } from '@sofie-prompter-editor/shared-model'
import { PersistentStorageHandler } from '../lib/PersistentStorageHandler.js'

export class OutputSettingsStore {
	private storage = new PersistentStorageHandler<OutputSettings>('outputSettings', OutputSettingsSchema)
	public outputSettings = observable.box<OutputSettings>({
		// _id: '',

		// TODO: load these from persistent store upon startup?
		fontSize: 4,

		mirrorHorizontally: false,
		mirrorVertically: false,

		focusPosition: 'center',
		showFocusPosition: false,

		marginHorizontal: 1,
		marginVertical: 1,

		activeRundownPlaylistId: null,
		savedSpeed: 0,
	})

	constructor() {
		makeAutoObservable(this, {
			create: action,
			update: action,
		})
		this.loadPersisted()
	}

	loadPersisted() {
		this.storage
			.get()
			.then((data) => {
				if (!data) return

				this.outputSettings.set(data)
			})
			.catch((e) => console.error(e))
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
			this.storage.set(outputSettings)
		}
	}
}
