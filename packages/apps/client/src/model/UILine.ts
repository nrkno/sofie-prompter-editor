import { Part, PartDisplayType, PartId, ProtectedString, protectString } from 'packages/shared/model/dist'
import { RundownStore } from '../stores/RundownStore'
import { randomId } from '../lib/lib'
import { makeAutoObservable } from 'mobx'

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

	constructor(private store: RundownStore, public partId: PartId, public id = protectString<UILineId>(randomId())) {
		makeAutoObservable(this)

		void this.store
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

	remove() {}
}

export type UILineId = ProtectedString<'UILineId', string>

function partDisplayTypeToLineTypeStyle(_type: PartDisplayType): LineType {
	return LineType.VT
}

export enum LineType {
	VT = 'vt',
	LiveSpeak = 'liveSpeak',
	Remote = 'remote',
	Split = 'split',
}
