import { makeAutoObservable } from 'mobx'
import { UILineId } from '../model/UILine'

export class UIStore {
	viewDividerPosition: number = 0.5
	selectedLineId: UILineId | null = null

	constructor() {
		makeAutoObservable(this)
	}

	setViewDividerPosition(value: number) {
		this.viewDividerPosition = value
	}

	setSelectedLineId(lineId: UILineId | null) {
		this.selectedLineId = lineId
	}
}
