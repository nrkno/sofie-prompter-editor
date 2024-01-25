import { useEffect, useRef } from 'react'
import { RootAppStore } from 'src/stores/RootAppStore'

export function useControllerMessages(ref: React.RefObject<HTMLElement>, heightPx: number, fontSizePx: number) {
	const speed = useRef(0)
	const position = useRef(0)
	const lastRequest = useRef<number | null>(null)
	const lastFrameTime = useRef<number | null>(null)

	useEffect(() => {
		const onMessage = (message: { speed: number }) => {
			console.log('received message', message)

			speed.current = message.speed
		}

		RootAppStore.connection.controller.on('message', onMessage)
		RootAppStore.connection.controller.subscribeToMessages().catch(console.error)

		const onFrame = (now: number) => {
			const frameTime = lastFrameTime.current === null ? 16 : now - lastFrameTime.current
			const scrollBy = ((speed.current * fontSizePx) / 300) * frameTime
			position.current = Math.max(0, position.current + scrollBy)
			console.log(position.current)

			ref.current?.scrollTo(0, position.current)

			lastFrameTime.current = now
			lastRequest.current = window.requestAnimationFrame(onFrame)
		}

		lastRequest.current = window.requestAnimationFrame(onFrame)

		return () => {
			RootAppStore.connection.controller.off('message', onMessage)

			if (lastRequest.current !== null) window.cancelAnimationFrame(lastRequest.current)
		}
	}, [ref, heightPx, fontSizePx])
}
