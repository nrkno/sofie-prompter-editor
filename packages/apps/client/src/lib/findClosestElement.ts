export function findClosestElement(
	elements: NodeListOf<HTMLElement>,
	yTarget: number,
	scrollTop: number
): { offset: number; anchorEl: HTMLElement } | null {
	// TODO: change binary search
	return binarySearch(elements, 0, elements.length - 1, yTarget, scrollTop)
}

function binarySearch(
	elements: NodeListOf<HTMLElement>,
	a: number,
	b: number,
	yTarget: number,
	scrollTop: number
): { offset: number; anchorEl: HTMLElement } | null {
	const elementsLength = elements.length
	if (elementsLength === 0) return null
	const elA = elements.item(a)
	const elB = elements.item(b)
	if (!elA && elB) {
		const boxB = elB.getBoundingClientRect()
		return { offset: boxB.y, anchorEl: elB }
	}
	if ((!elB && elA) || elA === elB) {
		const boxA = elA.getBoundingClientRect()
		return { offset: boxA.y, anchorEl: elA }
	}
	const boxA = elA.getBoundingClientRect()
	const boxB = elB.getBoundingClientRect()

	const distanceA = Math.abs(yTarget - boxA.y)
	const distanceB = Math.abs(yTarget - boxB.y)

	// elA is the top-most valid element and it's still below yTarget, choose elA
	if (a === 0 && boxA.y > scrollTop + yTarget) {
		return { offset: boxA.y, anchorEl: elA }
	}
	// elB is the bottom-most valid element and it's still above yTarget, choose elB
	if (b === elementsLength - 1 && boxB.y < scrollTop + yTarget) {
		return { offset: boxB.y, anchorEl: elB }
	}
	const range = Math.abs(a - b)
	if (range === 0) return { offset: boxA.y, anchorEl: elA }
	if (range === 1 && distanceA < distanceB) return { offset: boxA.y, anchorEl: elA }
	if (range === 1 && distanceB < distanceA) return { offset: boxB.y, anchorEl: elB }
	if (range > 1 && distanceA < distanceB)
		return binarySearch(elements, a, Math.min(elementsLength - 1, a + Math.ceil((b - a) / 2)), yTarget, scrollTop)
	if (range > 1 && distanceB < distanceA)
		return binarySearch(elements, Math.min(elementsLength - 1, a + Math.floor((b - a) / 2)), b, yTarget, scrollTop)

	return { offset: boxA.y, anchorEl: elA }
}
