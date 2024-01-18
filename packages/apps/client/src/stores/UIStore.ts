import { action, makeAutoObservable, makeObservable, observable } from 'mobx'
import { UILineId } from '../model/UILine'

export class UIStore {
	viewDividerPosition: number = 0
	selectedLineId: UILineId | null = null

	constructor() {
		makeObservable(this, {
			viewDividerPosition: observable,
			selectedLineId: observable,
		})

		this.viewDividerPosition = Number(window.localStorage.getItem('viewDividerPosition')) || 0.5
	}

	setViewDividerPosition = action('setViewDividerPosition', (value: number) => {
		this.viewDividerPosition = value
		window.localStorage.setItem('viewDividerPosition', String(value))
	})

	setSelectedLineId = action('setSelectedLineId', (lineId: UILineId | null) => {
		this.selectedLineId = lineId
	})
}
