import { TextMarkerId } from '@sofie-prompter-editor/shared-model'
import { UILineId } from 'src/model/UILine'
import { UISegmentId } from 'src/model/UISegment'

export function getAllAnchorElements(): NodeListOf<HTMLElement> {
	return document.querySelectorAll<HTMLElement>('[data-obj-id]')
}

export function getAnchorElementById(
	container: HTMLElement | Document,
	id: UISegmentId | UILineId | TextMarkerId
): HTMLElement | null {
	return container.querySelector(`[data-obj-id="${id}"]`)
}
export function getAllAnchorElementsByType(
	container: HTMLElement | Document,
	type: 'rundown' | 'segment' | 'line' | null
): NodeListOf<HTMLElement> {
	if (type === null) return container.querySelectorAll(`[data-anchor]`)
	else return container.querySelectorAll(`[data-anchor="${type}"]`)
}

/**
 * Returns the index of the closest anchor above the topPosition. -1 if no anchor is above the topPosition.
 */
export function getAnchorAbovePositionIndex(topPosition: number, anchors: HTMLElement[]): number {
	// Binary search
	let leftIndex = 0
	let rightIndex = anchors.length - 1
	while (leftIndex <= rightIndex) {
		const midIndex = Math.floor((leftIndex + rightIndex) / 2)
		const midPosition = anchors[midIndex].getBoundingClientRect().top

		if (midPosition > topPosition) {
			rightIndex = midIndex - 1
		} else if (midPosition < topPosition) {
			leftIndex = midIndex + 1
		} else {
			return midIndex
		}
	}
	return rightIndex
}
