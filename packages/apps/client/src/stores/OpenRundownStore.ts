import { action, makeObservable, observable } from 'mobx'
import { UIRundownId } from 'src/model/UIRundown'

class OpenRundownStoreClass {
	selectedRundownId: UIRundownId | null = null

	constructor() {
		makeObservable(this, {
			selectedRundownId: observable,
		})
	}

	setSelectedRundownId = action('setSelectedRundownId', (rundownId: UIRundownId | null) => {
		this.selectedRundownId = rundownId
	})
}
export const OpenRundownStore = new OpenRundownStoreClass()
