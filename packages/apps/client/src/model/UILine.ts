import { Part, PartDisplayType, PartId, ProtectedString, protectString } from '@sofie-prompter-editor/shared-model'
import { RundownStore } from '../stores/RundownStore'
import { randomId } from '../lib/lib'
import { action, makeAutoObservable } from 'mobx'
import { UISegment } from './UISegment'

export class UILine {
	slug: string = ''

	rank: number = 0

	identifier: string | null = null

	lineType: {
		label: string

		style: LineType
	} | null = null

	script: string | null = null

	expectedDuration: number | null = null

	isNew: boolean = false

	ready: boolean = false

	constructor(private store: RundownStore, private owner: UISegment, public id: PartId) {
		makeAutoObservable(this, {
			updateFromJson: action,
			remove: action,
		})

		this.store.connection.part.on('updated', (json: Part) => {
			if (this.id !== json._id) return

			this.updateFromJson(json)
		})

		this.store.connection.part.on('removed', (json) => {
			if (this.id !== json._id) return

			this.remove()
		})
	}

	updateFromJson(json: Part) {
		this.identifier = json.identifier ?? null
		this.slug = json.label
		this.rank = json.rank
		this.script = json.scriptContents ?? null
		this.isNew = json.isNew ?? false
		this.expectedDuration = json.expectedDuration ?? null
		this.lineType = {
			label: json.display.label,
			style: partDisplayTypeToLineTypeStyle(json.display.type),
		}

		this.ready = true
	}

	remove() {
		this.owner.lines.delete(this.id)
		this.dispose()
	}

	dispose() {}
}

function partDisplayTypeToLineTypeStyle(type: PartDisplayType): LineType {
	switch (type) {
		case PartDisplayType.Camera:
			return LineType.Camera
		case PartDisplayType.LiveSpeak:
			return LineType.LiveSpeak
		case PartDisplayType.Remote:
			return LineType.Remote
		case PartDisplayType.Split:
			return LineType.Split
		case PartDisplayType.VT:
			return LineType.VT
	}
	return LineType.VT
}

export enum LineType {
	Camera = 'camera',
	VT = 'vt',
	LiveSpeak = 'liveSpeak',
	Remote = 'remote',
	Split = 'split',
}
