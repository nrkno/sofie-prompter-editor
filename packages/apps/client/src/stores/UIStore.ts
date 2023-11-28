import { makeAutoObservable } from 'mobx'

export class UIStore {
	viewDividerPosition: number = 0.5

	constructor() {
		makeAutoObservable(this, {})
	}

	setViewDividerPosition(value: number) {
		this.viewDividerPosition = value
	}
}
