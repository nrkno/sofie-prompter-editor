import { TextMarkerId } from '@sofie-prompter-editor/shared-model'
import { UILineId } from 'src/model/UILine'
import { UISegmentId } from 'src/model/UISegment'

export function getAllAnchorElements(): NodeListOf<HTMLElement> {
	return document.querySelectorAll<HTMLElement>('[data-obj-id]')
}

export function getAnchorElementById(id: UISegmentId | UILineId | TextMarkerId): HTMLElement | null {
	return document.querySelector(`[data-obj-id="${id}"]`)
}
