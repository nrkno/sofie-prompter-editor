import { useEffect, useLayoutEffect, useState } from 'react'
import useResizeObserver from '@react-hook/resize-observer'

export function useSize(target: React.RefObject<HTMLElement>): BoxSize | undefined {
	const [size, setSize] = useState<{ width: number; height: number }>()

	useEffect(() => {
		console.log(size, target.current)
	}, [size, target])

	useLayoutEffect(() => {
		if (!target.current) return

		setSize(target.current.getBoundingClientRect())
	}, [target])

	// Where the magic happens
	useResizeObserver(target, (entry) =>
		setSize({ width: entry.borderBoxSize[0].inlineSize, height: entry.borderBoxSize[0].blockSize })
	)
	return size
}

type BoxSize = {
	width: number
	height: number
}
