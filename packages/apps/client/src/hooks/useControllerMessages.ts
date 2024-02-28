import { offset } from '@popperjs/core'
import {
	ControllerMessage,
	ViewPortLastKnownState,
	ViewPortState,
	protectString,
} from '@sofie-prompter-editor/shared-model'
import { toJS } from 'mobx'
import { useCallback, useEffect, useRef } from 'react'
import { getAllAnchorElementsByType, getAnchorElementById, getAnchorAbovePositionIndex } from 'src/lib/anchorElements'
import { getCurrentTime } from 'src/lib/getCurrentTime'
import { RootAppStore } from 'src/stores/RootAppStore'

export const SPEED_CONSTANT = 300 // this is an arbitrary number to scale a reasonable speed number * font size to pixels/frame

export const pointOfFocus = 0 // TODO
const animateOffsetFactor = 0.1

type SetBaseViewPortState = (state: ViewPortLastKnownState) => void

/**
 * This is a hook that allows you to control a container element using Controller messages.
 *
 * @export
 * @param {React.RefObject<HTMLElement>} ref The container element that will be scrolled
 * @param {number} fontSizePx The size of the font in pixels
 * @param {{
 * 		enableControl?: boolean
 * 		onControllerMessage?: (message: ControllerMessage) => void
 * 	}} [opts] Additional properties for conditionally enabling the hook and listening for controller messages
 * @return {*}  {({
 * 	lastKnownState: React.RefObject<ViewPortLastKnownState | null>
 * 	position: React.MutableRefObject<number>
 * 	speed: React.MutableRefObject<number>
 * 	setBaseViewPortState: SetBaseViewPortState
 * })}
 */
export function useControllerMessages(
	ref: React.RefObject<HTMLElement>,
	fontSizePx: number,
	opts?: {
		enableControl?: boolean
		onStateChange?: (timestamp: number, position: number, speed: number, animatedOffset: number) => void
	}
): {
	lastKnownState: React.RefObject<ViewPortLastKnownState | null>
	position: React.MutableRefObject<number>
	scrolledPosition: React.MutableRefObject<number>
	speed: React.MutableRefObject<number>
	animatedOffset: React.MutableRefObject<number>
	setBaseViewPortState: SetBaseViewPortState
} {
	const enableControl = opts?.enableControl ?? true
	const onStateChange = opts?.onStateChange

	const speed = useRef(0)
	const position = useRef(0)
	const scrolledPosition = useRef(0)
	const lastResultingSpeed = useRef(0)

	const animatedOffset = useRef(0)

	const lastRequestAnimationFrame = useRef<number | null>(null)
	const lastFrameTime = useRef<number>(Number(document.timeline.currentTime))

	const lastKnownState = useRef<ViewPortLastKnownState | null>(null)

	const onFrame = useCallback(
		(now: number) => {
			lastRequestAnimationFrame.current = null

			const el = ref.current
			if (!el) return

			const frameTime = now - lastFrameTime.current

			const controlSpeed = ((speed.current * fontSizePx) / SPEED_CONSTANT) * frameTime
			const positioningSpeed0 = animatedOffset.current * animateOffsetFactor
			const positioningSpeed = ((positioningSpeed0 * fontSizePx) / SPEED_CONSTANT) * frameTime
			const resultingSpeed = controlSpeed + positioningSpeed

			lastResultingSpeed.current = resultingSpeed
			position.current = Math.min(Math.max(0, position.current + resultingSpeed), el.scrollHeight - el.offsetHeight)

			animatedOffset.current = animatedOffset.current - positioningSpeed

			if (Math.abs(animatedOffset.current) < 0.1) {
				animatedOffset.current = 0
			}

			if (scrolledPosition.current !== position.current) {
				el.scrollTo({
					top: position.current,
					behavior: 'instant',
				})
				scrolledPosition.current = position.current
			}

			lastFrameTime.current = now
			lastRequestAnimationFrame.current = window.requestAnimationFrame(onFrame)
		},
		[fontSizePx, ref]
	)

	const applyControllerMessage = useCallback(
		(message: ControllerMessage, _timestamp = getCurrentTime()) => {
			if (!ref.current) return

			const container = ref.current

			if (message.offset) {
				if (message.offset.target !== null) {
					const targetEl = getAnchorElementById(container, message.offset.target)
					if (!targetEl) {
						console.error(`Could not find target "${message.offset.target}"`)
						return
					}

					const targetRect = targetEl.getBoundingClientRect()
					position.current = scrolledPosition.current + targetRect.top - message.offset.offset * fontSizePx
				} else {
					position.current = message.offset.offset * fontSizePx
				}
				animatedOffset.current = 0
			}
			if (message.speed !== undefined) {
				speed.current = message.speed
			}
			if (message.jumpBy !== undefined) {
				animatedOffset.current += message.jumpBy * fontSizePx
			}
			if (message.jumpTarget) {
				const allAnchors = getAllAnchorElementsByType(container, message.jumpTarget.type)
				const eventualPosition = pointOfFocus + 10 + animatedOffset.current
				const aboveAnchorIndex = getAnchorAbovePositionIndex(eventualPosition, Array.from(allAnchors))

				const aboveAnchorEl = allAnchors[aboveAnchorIndex]
				let aboveAnchorPosition = 0
				if (aboveAnchorEl) {
					const aboveAnchorElRect = aboveAnchorEl.getBoundingClientRect()
					aboveAnchorPosition = aboveAnchorElRect.top
				}

				let jumpIndex = message.jumpTarget.index
				if (jumpIndex === -1 && aboveAnchorPosition < -50) {
					jumpIndex = 0
				}

				const jumpToAnchorIndex = Math.min(allAnchors.length - 1, Math.max(0, aboveAnchorIndex + jumpIndex))
				const anchorEl = allAnchors[jumpToAnchorIndex]
				const targetRect = anchorEl.getBoundingClientRect()

				animatedOffset.current = scrolledPosition.current + targetRect.top - position.current
			}
		},
		[ref, fontSizePx]
	)

	const setBaseViewPortState = useCallback(
		(state: ViewPortLastKnownState) => {
			console.log(`Received a new lastKnownState`, toJS(state.state.offset), toJS(state.state.animatedOffset))
			if (!ref.current) return

			const container = ref.current

			let newPosition = scrolledPosition.current

			if (state.state.offset.target !== null) {
				const targetEl = getAnchorElementById(container, state.state.offset.target)
				if (!targetEl) {
					console.error(`Could not find target "${state.state.offset.target}"`)
					return
				}

				const targetRect = targetEl.getBoundingClientRect()
				newPosition = scrolledPosition.current + targetRect.top - state.state.offset.offset * fontSizePx
			} else {
				newPosition = state.state.offset.offset * fontSizePx
			}
			speed.current = state.state.speed
			animatedOffset.current = state.state.animatedOffset * fontSizePx

			// Determine if we're going to jump or animate:
			if (Math.abs(newPosition - scrolledPosition.current) < fontSizePx * 0.5 && speed.current === 0) {
				animatedOffset.current += newPosition - scrolledPosition.current
			} else {
				position.current = newPosition
			}

			const timeDifference = getCurrentTime() - state.timestamp
			// Advance position from speed:
			position.current += ((speed.current * fontSizePx) / SPEED_CONSTANT) * timeDifference

			// Advance position from animatedOffset:
			if (timeDifference > 1000) {
				// Just set it to the end position if enough time has passed:
				position.current += animatedOffset.current
				animatedOffset.current = 0
			}
		},
		[fontSizePx, ref]
	)

	const reportState = useCallback(() => {
		onStateChange?.(getCurrentTime(), position.current, speed.current, animatedOffset.current)
	}, [onStateChange])

	useEffect(() => {
		if (!enableControl) return

		const onMessage = (message: ControllerMessage) => {
			console.log('received message', message)

			applyControllerMessage(message)

			// wait for OnFrame to trigger first:
			window.requestAnimationFrame(reportState)
		}

		RootAppStore.control.on('message', onMessage)
		RootAppStore.control.initialize()

		return () => {
			RootAppStore.control.off('message', onMessage)
		}
	}, [enableControl, applyControllerMessage, reportState])

	useEffect(() => {
		if (!enableControl) return

		onFrame(Date.now())
		return () => {
			if (lastRequestAnimationFrame.current !== null) window.cancelAnimationFrame(lastRequestAnimationFrame.current)
		}
	}, [enableControl, ref, onFrame])

	return {
		lastKnownState,
		setBaseViewPortState,
		scrolledPosition,
		position,
		speed,
		animatedOffset,
	}
}
