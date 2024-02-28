import React, { useEffect, useRef } from 'react'
import { UIRundown } from 'src/model/UIRundown'
import { Lambda, observe } from 'mobx'
import { UISegment, UISegmentId } from 'src/model/UISegment'
import { UILine, UILineId } from 'src/model/UILine'
import { findClosestElement } from 'src/lib/findClosestElement'
import { getAllAnchorElementsByType } from 'src/lib/anchorElements'

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
	scrollPositionRef: React.MutableRefObject<number>,
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

				// Get the position of the closest element before the change:
				const els = getAllAnchorElementsByType(ref.current, null)
				const closestEl = findClosestElement(els, focusPosition, scrollPositionRef.current)
				if (!closestEl) return
				const oldPosition = closestEl.offset

				const onNextFrame = (_now: number) => {
					frameRequest.current = null

					// Get the position of that element after the change:
					const newBox = closestEl.anchorEl.getBoundingClientRect()
					const diff = newBox.y - oldPosition

					if (diff === 0) return
					if (!ref.current) return
					const boxEl = ref.current

					positionRef.current += diff

					boxEl.scrollTo({
						top: positionRef.current,
						behavior: 'instant',
					})
					scrollPositionRef.current = positionRef.current

					onUpdate?.({
						element: closestEl.anchorEl,
						offset: closestEl.offset,
					})
				}

				frameRequest.current = window.requestAnimationFrame(onNextFrame)
			}),
		[ref, positionRef, focusPosition, rundown, fontSizePx, speedRef, onUpdate, scrollPositionRef]
	)
}

function observeUIRundown(rundown: UIRundown | null, clb: Lambda): Lambda {
	if (!rundown) return noop

	const destructors: Lambda[] = []

	destructors.push(
		observe(rundown, 'name', () => {
			// console.log('rundown:name', change)

			clb()
		}),
		observe(rundown, 'ready', () => {
			// console.log('rundown:ready', change)

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
			// console.log('line:identifier')

			clb()
		}),
		observe(line, 'slug', () => {
			// console.log('line:slug')

			clb()
		}),
		observe(line, 'rank', () => {
			// console.log('line:rank')

			clb()
		}),
		observe(line, 'script', () => {
			// console.log('line:script')

			clb()
		})
	)

	return () => {
		destructors.forEach((destroy) => destroy())
	}
}

function noop() {}
