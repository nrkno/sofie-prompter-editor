import { Part, PartDisplayType, PartId } from '@sofie-prompter-editor/shared-model'
import { RundownStore } from '../stores/RundownStore'
import { action, makeAutoObservable } from 'mobx'
import { UISegment } from './UISegment'
import { convertPlainTextScriptToMarkdown } from 'src/lib/markdownishUtils'

export type UILineId = PartId

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

	readTime: number | null = null

	isNew: boolean = false

	ready: boolean = false

	constructor(private store: RundownStore, private owner: UISegment, public id: UILineId) {
		makeAutoObservable(this, {
			updateFromJson: action,
			remove: action,
		})

		this.store.connection.part.on('updated', this.onPartUpdated)
		this.store.connection.part.on('removed', this.onPartRemoved)
	}

	private onPartUpdated = action('onPartUpdated', (json: Part) => {
		if (this.id !== json._id) return

		this.updateFromJson(json)
	})

	private onPartRemoved = action('onPartRemoved', (json: Pick<Part, '_id'>) => {
		if (this.id !== json._id) return

		this.remove()
	})

	updateFromJson(json: Part) {
		this.identifier = json.identifier ?? null
		this.slug = json.label
		this.rank = json.rank
		this.script = json.editedScriptContents ?? this.convertScriptContentsToMarkdown(json.scriptContents) ?? null
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

	dispose() {
		this.store.connection.part.off('updated', this.onPartUpdated)
		this.store.connection.part.off('removed', this.onPartRemoved)
	}

	private convertScriptContentsToMarkdown(script: string | undefined): string | undefined {
		if (script === undefined) return undefined
		return convertPlainTextScriptToMarkdown(script)
	}
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
