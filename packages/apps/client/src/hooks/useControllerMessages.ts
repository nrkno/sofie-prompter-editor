import { ControllerMessage, ViewPortLastKnownState, ViewPortState } from '@sofie-prompter-editor/shared-model'
import { toJS } from 'mobx'
import { useCallback, useEffect, useRef } from 'react'
import { getAnchorElementById } from 'src/lib/anchorElements'
import { getCurrentTime } from 'src/lib/getCurrentTime'
import { RootAppStore } from 'src/stores/RootAppStore'

export const SPEED_CONSTANT = 300 // this is an arbitrary number to scale a reasonable speed number * font size to pixels/frame

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
		onStateChange?: (message: ViewPortState) => void
	}
): {
	lastKnownState: React.RefObject<ViewPortLastKnownState | null>
	position: React.MutableRefObject<number>
	speed: React.MutableRefObject<number>
	setBaseViewPortState: SetBaseViewPortState
} {
	const enableControl = opts?.enableControl ?? true
	const onStateChange = opts?.onStateChange

	const speed = useRef(0)
	const position = useRef(0)
	const lastRequest = useRef<number | null>(null)
	const lastFrameTime = useRef<number>(Number(document.timeline.currentTime))

	const lastKnownState = useRef<ViewPortLastKnownState | null>(null)

	const applyControllerMessage = useCallback(
		(message: ControllerMessage, timestamp = getCurrentTime()) => {
			speed.current = message.speed ?? speed.current

			let targetTop = position.current

			if (message.offset) {
				targetTop = 0

				if (message.offset.target !== null) {
					const targetEl = getAnchorElementById(message.offset.target)
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

			const combinedMessage = {
				offset: message.offset ??
					lastKnownState.current?.controllerMessage.offset ?? {
						target: null,
						offset: 0,
					},
				speed: speed.current,
			}

			lastKnownState.current = {
				timestamp: getCurrentTime(),
				controllerMessage: combinedMessage,
			}

			onStateChange?.(combinedMessage)
		}

		RootAppStore.connection.controller.on('message', onMessage)
		RootAppStore.connection.controller.subscribeToMessages().catch(console.error)

		const onFrame = (now: number) => {
			const el = ref.current
			if (!el) return

			const frameTime = now - lastFrameTime.current
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
	}, [enableControl, ref, fontSizePx, onStateChange, applyControllerMessage])

	return {
		lastKnownState,
		setBaseViewPortState,
		position,
		speed,
	}
}
