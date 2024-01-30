import { ControllerMessage, ViewPortLastKnownState } from '@sofie-prompter-editor/shared-model'
import { useCallback, useEffect, useRef } from 'react'
import { getCurrentTime } from 'src/lib/getCurrentTime'
import { RootAppStore } from 'src/stores/RootAppStore'

const SPEED_CONSTANT = 300 // this is an arbitrary number to scale a reasonable speed number * font size to pixels/frame
const STANDARD_FRAME_TIME = 16 // a 60Hz framerate roughly equates to 16ms/frame

type SetBaseViewPortState = (state: ViewPortLastKnownState) => void

export function useControllerMessages(
	ref: React.RefObject<HTMLElement>,
	fontSizePx: number,
	onControllerMessage?: (message: ControllerMessage) => void
): [React.RefObject<ViewPortLastKnownState | null>, SetBaseViewPortState] {
	const speed = useRef(0)
	const position = useRef(0)
	const lastRequest = useRef<number | null>(null)
	const lastFrameTime = useRef<number | null>(null)

	const lastKnownState = useRef<ViewPortLastKnownState | null>(null)

	const applyControllerMessage = useCallback(
		(message: ControllerMessage, timestamp = getCurrentTime()) => {
			speed.current = message.speed

			let targetTop = position.current

			if (message.offset?.target !== undefined) {
				const targetEl = document.querySelector(`[data-obj-id="${message.offset.target}"]`)
				if (!targetEl) {
					console.error(`Could not find target "${message.offset.target}"`)
					return
				}

				const targetRect = targetEl.getBoundingClientRect()
				targetTop = targetRect.top + position.current
			} else if (message.offset?.target === null) {
				targetTop = 0
			}

			if (message.offset?.offset) {
				targetTop = targetTop + message.offset?.offset * fontSizePx
			}

			if (message.speed) {
				speed.current = message.speed
				const timeDifference = getCurrentTime() - timestamp
				targetTop = targetTop + ((speed.current * fontSizePx) / SPEED_CONSTANT) * timeDifference
			}

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
			console.log(`Received a new lastKnownState`, state)

			applyControllerMessage(state.controllerMessage, state.timestamp)
		},
		[applyControllerMessage]
	)

	useEffect(() => {
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
			const frameTime = lastFrameTime.current === null ? STANDARD_FRAME_TIME : now - lastFrameTime.current
			const scrollBy = ((speed.current * fontSizePx) / SPEED_CONSTANT) * frameTime
			position.current = Math.max(0, position.current + scrollBy)

			// console.log(position.current)

			ref.current?.scrollTo({
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
	}, [ref, fontSizePx, onControllerMessage, applyControllerMessage])

	return [lastKnownState, setBaseViewPortState]
}
