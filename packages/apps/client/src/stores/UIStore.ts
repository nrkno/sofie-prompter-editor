import { action, makeObservable, observable } from 'mobx'
import { EventEmitter } from 'eventemitter3'
import { UILineId } from '../model/UILine'

interface UIStoreEvents {
	scrollEditorToLine: {
		lineId: UILineId
	}
}

export class UIStore extends EventEmitter<UIStoreEvents> {
	viewDividerPosition: number = 0
	selectedLineId: UILineId | null = null

	constructor() {
		super()

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
