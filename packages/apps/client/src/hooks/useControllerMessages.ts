import { ControllerMessage, ViewPortLastKnownState } from '@sofie-prompter-editor/shared-model'
import { toJS } from 'mobx'
import { useCallback, useEffect, useRef } from 'react'
import { getCurrentTime } from 'src/lib/getCurrentTime'
import { RootAppStore } from 'src/stores/RootAppStore'

const SPEED_CONSTANT = 300 // this is an arbitrary number to scale a reasonable speed number * font size to pixels/frame
const STANDARD_FRAME_TIME = 16 // a 60Hz framerate roughly equates to 16ms/frame

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
		onControllerMessage?: (message: ControllerMessage) => void
	}
): {
	lastKnownState: React.RefObject<ViewPortLastKnownState | null>
	position: React.MutableRefObject<number>
	speed: React.MutableRefObject<number>
	setBaseViewPortState: SetBaseViewPortState
} {
	const enableControl = opts?.enableControl ?? true
	const onControllerMessage = opts?.onControllerMessage

	const speed = useRef(0)
	const position = useRef(0)
	const lastRequest = useRef<number | null>(null)
	const lastFrameTime = useRef<number | null>(null)

	const lastKnownState = useRef<ViewPortLastKnownState | null>(null)

	const applyControllerMessage = useCallback(
		(message: ControllerMessage, timestamp = getCurrentTime()) => {
			speed.current = message.speed

			let targetTop = position.current

			if (message.offset) {
				targetTop = 0

				if (message.offset.target !== null) {
					const targetEl = document.querySelector(`[data-obj-id="${message.offset.target}"]`)
					if (!targetEl) {
						console.error(`Could not find target "${message.offset.target}"`)
						return
					}

					const targetRect = targetEl.getBoundingClientRect()
					targetTop = targetRect.top + position.current - message.offset.offset * fontSizePx
				} else {
					targetTop = targetTop + message.offset.offset * fontSizePx
				}
			}

			speed.current = message.speed
			const timeDifference = getCurrentTime() - timestamp
			targetTop = targetTop + ((speed.current * fontSizePx) / SPEED_CONSTANT) * timeDifference

			position.current = targetTop

			ref.current?.scrollTo({
				top: targetTop,
				behavior: 'instant',
			})
		},
		[ref, fontSizePx]
	)

	const setBaseViewPortState = useCallback(
		(state: ViewPortLastKnownState) => {
			console.log(`Received a new lastKnownState`, toJS(state))

			applyControllerMessage(state.controllerMessage, state.timestamp)
		},
		[applyControllerMessage]
	)

	useEffect(() => {
		if (!enableControl) return

		const onMessage = (message: ControllerMessage) => {
			console.log('received message', message)

			applyControllerMessage(message)

			lastKnownState.current = {
				timestamp: getCurrentTime(),
				controllerMessage: message,
			}

			onControllerMessage?.(message)
		}

		RootAppStore.connection.controller.on('message', onMessage)
		RootAppStore.connection.controller.subscribeToMessages().catch(console.error)

		const onFrame = (now: number) => {
			const el = ref.current
			if (!el) return

			const frameTime = lastFrameTime.current === null ? STANDARD_FRAME_TIME : now - lastFrameTime.current
			const scrollBy = ((speed.current * fontSizePx) / SPEED_CONSTANT) * frameTime

			if (scrollBy === 0) {
				lastFrameTime.current = now
				lastRequest.current = window.requestAnimationFrame(onFrame)
				return
			}

			position.current = Math.min(Math.max(0, position.current + scrollBy), el.scrollHeight - el.offsetHeight)

			// console.log(position.current)

			el.scrollTo({
				top: position.current,
				behavior: 'instant',
			})

			lastFrameTime.current = now
			lastRequest.current = window.requestAnimationFrame(onFrame)
		}

		lastRequest.current = window.requestAnimationFrame(onFrame)

		return () => {
			RootAppStore.connection.controller.off('message', onMessage)

			if (lastRequest.current !== null) window.cancelAnimationFrame(lastRequest.current)
		}
	}, [enableControl, ref, fontSizePx, onControllerMessage, applyControllerMessage])

	return {
		lastKnownState,
		setBaseViewPortState,
		position,
		speed,
	}
}
