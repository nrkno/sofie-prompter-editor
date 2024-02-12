import React, { useEffect, useRef } from 'react'
import { UIRundown } from 'src/model/UIRundown'
import { Lambda, observe } from 'mobx'
import { UISegment, UISegmentId } from 'src/model/UISegment'
import { UILine, UILineId } from 'src/model/UILine'
import { SPEED_CONSTANT } from './useControllerMessages'
import { findClosestElement } from 'src/lib/findClosestElement'
import { getAllAnchorElements } from 'src/lib/anchorElements'

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

				const els = getAllAnchorElements()
				const [anchorOffset, anchorEl] = findClosestElement(els, focusPosition, positionRef.current)

				// console.log('Chosen anchor is: ', anchorOffset, anchorEl, 'position is: ', positionRef.current)

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

					// console.log('Position now is: ', positionRef.current, diff)

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
