import React, { useEffect, useRef } from 'react'
import { UIRundown } from 'src/model/UIRundown'
import { Lambda, observe } from 'mobx'
import { UISegment, UISegmentId } from 'src/model/UISegment'
import { UILine, UILineId } from 'src/model/UILine'
import { SPEED_CONSTANT } from './useControllerMessages'

export type UpdateProps = {
	element: HTMLElement
	offset: number
}

/**
 * This is a hook that keeps `ref` element in place while updates happen inside `rundown`.
 * `focusPosition` declares the "focus" offset, the position where to look for the anchoring element.
 *
 * @export
 * @param {React.RefObject<HTMLElement>} ref
 * @param {(UIRundown | null)} rundown
 * @param {React.MutableRefObject<number>} positionRef
 * @param {number} focusPosition
 * @param {{
 * 		onUpdate: (message: UpdateProps) => void
 * 	}} [opts]
 */
export function useKeepRundownOutputInPosition(
	ref: React.RefObject<HTMLElement>,
	rundown: UIRundown | null,
	fontSizePx: number,
	speedRef: React.RefObject<number>,
	positionRef: React.MutableRefObject<number>,
	focusPosition: number,
	opts?: {
		onUpdate: (message: UpdateProps) => void
	}
) {
	const frameRequest = useRef<number | null>(null)

	const onUpdate = opts?.onUpdate

	useEffect(
		() =>
			observeUIRundown(rundown, () => {
				if (frameRequest.current) return
				if (!ref.current) return

				const speed = speedRef.current
				if (speed === null) return

				const els = document.querySelectorAll<HTMLElement>('[data-obj-id]')
				const [anchorOffset, anchorEl] = findClosestElement(els, focusPosition, positionRef.current)

				console.log('Chosen anchor is: ', anchorOffset, anchorEl, 'position is: ', positionRef.current)

				const beforeTime = Number(document.timeline.currentTime)

				const onNextFrame = (now: number) => {
					frameRequest.current = null

					const frameTime = now - beforeTime
					const scrollBy = ((speed * fontSizePx) / SPEED_CONSTANT) * frameTime

					const newBox = anchorEl.getBoundingClientRect()
					const diff = newBox.y - anchorOffset
					if (diff === 0) return
					if (!ref.current) return
					const boxEl = ref.current

					positionRef.current = positionRef.current + diff + scrollBy
					boxEl.scrollTo({
						top: positionRef.current,
						behavior: 'instant',
					})

					console.log('Position now is: ', positionRef.current, diff)

					onUpdate?.({
						element: anchorEl,
						offset: anchorOffset,
					})
				}

				frameRequest.current = window.requestAnimationFrame(onNextFrame)
			}),
		[ref, positionRef, focusPosition, rundown, fontSizePx, speedRef, onUpdate]
	)
}

function findClosestElement(
	elements: NodeListOf<HTMLElement>,
	yTarget: number,
	scrollTop: number
): [number, HTMLElement] {
	function binarySearch(
		elements: NodeListOf<HTMLElement>,
		a: number,
		b: number,
		yTarget: number
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
			return binarySearch(elements, a, Math.min(elementsLength - 1, a + Math.ceil((b - a) / 2)), yTarget)
		if (range > 1 && distanceB < distanceA)
			return binarySearch(elements, Math.min(elementsLength - 1, a + Math.floor((b - a) / 2)), b, yTarget)

		return [boxA.y, elA]
	}

	return binarySearch(elements, 0, elements.length - 1, yTarget)
}

function observeUIRundown(rundown: UIRundown | null, clb: Lambda): Lambda {
	if (!rundown) return noop

	const destructors: Lambda[] = []

	destructors.push(
		observe(rundown, () => {
			// console.log('rundown', change)

			clb()
		})
	)

	const childDestructors: Map<UISegmentId, Lambda> = new Map()

	destructors.push(
		observe(rundown.segments, (change) => {
			// console.log('segments', change)

			if (change.type === 'add') {
				childDestructors.set(change.name, observeUISegment(change.newValue, clb))
			} else if (change.type === 'update') {
				const oldDestructor = childDestructors.get(change.name)
				if (oldDestructor) oldDestructor()
				childDestructors.set(change.name, observeUISegment(change.newValue, clb))
			} else if (change.type === 'delete') {
				const oldDestructor = childDestructors.get(change.name)
				if (oldDestructor) oldDestructor()
			}

			clb()
		})
	)

	return () => {
		childDestructors.forEach((destroy) => destroy())
		destructors.forEach((destroy) => destroy())
	}
}

function observeUISegment(segment: UISegment | null, clb: Lambda): Lambda {
	if (!segment) return noop

	const destructors: Lambda[] = []

	destructors.push(
		observe(segment, () => {
			// console.log('segment', change)

			clb()
		})
	)

	const childDestructors: Map<UILineId, Lambda> = new Map()

	destructors.push(
		observe(segment.lines, (change) => {
			// console.log('lines', change)

			if (change.type === 'add') {
				childDestructors.set(change.name, observeUILine(change.newValue, clb))
			} else if (change.type === 'update') {
				const oldDestructor = childDestructors.get(change.name)
				if (oldDestructor) oldDestructor()
				childDestructors.set(change.name, observeUILine(change.newValue, clb))
			} else if (change.type === 'delete') {
				const oldDestructor = childDestructors.get(change.name)
				if (oldDestructor) oldDestructor()
			}

			clb()
		})
	)

	return () => {
		childDestructors.forEach((destroy) => destroy())
		destructors.forEach((destroy) => destroy())
	}
}

function observeUILine(line: UILine | null, clb: Lambda): Lambda {
	if (!line) return noop

	const destructors: Lambda[] = []

	destructors.push(
		observe(line, 'identifier', () => {
			// console.log('line:identifier', change)

			clb()
		}),
		observe(line, 'slug', () => {
			// console.log('line:slug', change)

			clb()
		}),
		observe(line, 'rank', () => {
			// console.log('line:rank', change)

			clb()
		}),
		observe(line, 'script', () => {
			// console.log('line:script', change)

			clb()
		})
	)

	return () => {
		destructors.forEach((destroy) => destroy())
	}
}

function noop() {}
