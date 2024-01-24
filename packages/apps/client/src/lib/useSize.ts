import { useLayoutEffect, useState } from 'react'
import useResizeObserver from '@react-hook/resize-observer'

export function useSize(target: React.RefObject<HTMLElement>): DOMRect | undefined {
	const [size, setSize] = useState<DOMRect>()

	useLayoutEffect(() => {
		if (!target.current) return

		setSize(target.current.getBoundingClientRect())
	}, [target])

	// Where the magic happens
	useResizeObserver(target, (entry) => setSize(entry.contentRect))
	return size
}
