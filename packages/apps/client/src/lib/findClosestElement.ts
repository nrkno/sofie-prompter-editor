export function findClosestElement(
	elements: NodeListOf<HTMLElement>,
	yTarget: number,
	scrollTop: number
): [number, HTMLElement] {
	return binarySearch(elements, 0, elements.length - 1, yTarget, scrollTop)
}

function binarySearch(
	elements: NodeListOf<HTMLElement>,
	a: number,
	b: number,
	yTarget: number,
	scrollTop: number
): [number, HTMLElement] {
	const elementsLength = elements.length
	const elA = elements.item(a)
	const elB = elements.item(b)
	if (!elA && elB) {
		const boxB = elB.getBoundingClientRect()
		return [boxB.y, elB]
	}
	if ((!elB && elA) || elA === elB) {
		const boxA = elA.getBoundingClientRect()
		return [boxA.y, elA]
	}
	const boxA = elA.getBoundingClientRect()
	const boxB = elB.getBoundingClientRect()

	const distanceA = Math.abs(yTarget - boxA.y)
	const distanceB = Math.abs(yTarget - boxB.y)

	// elA is the top-most valid element and it's still below yTarget, choose elA
	if (a === 0 && boxA.y > scrollTop + yTarget) {
		return [boxA.y, elA]
	}
	// elB is the bottom-most valid element and it's still above yTarget, choose elB
	if (b === elementsLength - 1 && boxB.y < scrollTop + yTarget) {
		return [boxB.y, elB]
	}
	const range = Math.abs(a - b)
	if (range === 0) return [boxA.y, elA]
	if (range === 1 && distanceA < distanceB) return [boxA.y, elA]
	if (range === 1 && distanceB < distanceA) return [boxB.y, elB]
	if (range > 1 && distanceA < distanceB)
		return binarySearch(elements, a, Math.min(elementsLength - 1, a + Math.ceil((b - a) / 2)), yTarget, scrollTop)
	if (range > 1 && distanceB < distanceA)
		return binarySearch(elements, Math.min(elementsLength - 1, a + Math.floor((b - a) / 2)), b, yTarget, scrollTop)

	return [boxA.y, elA]
}
