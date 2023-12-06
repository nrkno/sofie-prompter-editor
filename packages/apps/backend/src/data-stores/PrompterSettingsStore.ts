import { action, makeAutoObservable, observable } from 'mobx'
import isEqual from 'lodash.isequal'
import { PrompterSettings } from 'packages/shared/model/dist'

export class PrompterSettingsStore {
	public prompterSettings = observable<PrompterSettings>({
		// TODO: load these from persistent store upon startup?
		fontSize: 10,

		mirrorHorizontally: false,
		mirrorVertically: false,

		focusPosition: 'center',
		showFocusPosition: false,

		marginHorizontal: 5,
		marginVertical: 5,
	})

	constructor() {
		makeAutoObservable(this, {
			create: action,
			update: action,
		})
	}

	create(data: PrompterSettings) {
		this._updateIfChanged(data)
	}
	update(data: PrompterSettings) {
		this._updateIfChanged(data)
	}

	private _updateIfChanged(prompterSettings: PrompterSettings) {
		if (!isEqual(this.prompterSettings, prompterSettings)) {
			this.prompterSettings = prompterSettings
		}
	}
}
