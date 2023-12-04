import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import classes from './SplitPanel.module.css'

export function SplitPanel({
	position,
	onChange,
	childrenBegin,
	childrenEnd,
	className,
}: {
	className?: string
	position?: number
	onChange?: ChangeEventHandler
	childrenBegin: ReactNode
	childrenEnd: ReactNode
	children?: null
}) {
	const [isResizing, setIsResizing] = useState(false)
	const beginCoords = useRef<{ x: number; y: number } | null>(null)
	const initialPos = useRef<number>(position ?? 0.5)
	const container = useRef<HTMLDivElement>(null)
	const contRect = useRef<DOMRect | null>(null)

	const defaultedPosition = position ?? 0.5

	function onMouseDown(e: React.MouseEvent) {
		setIsResizing(true)
		beginCoords.current = { x: e.clientX, y: e.clientY }
		contRect.current = container.current?.getBoundingClientRect() ?? null
	}

	const style = useMemo<React.CSSProperties>(() => {
		const fract = Math.max(0, Math.min(1, defaultedPosition))
		return {
			'--position-a': `${fract}fr`,
			'--position-b': `${1 - fract}fr`,
		} as React.CSSProperties
	}, [defaultedPosition])

	useEffect(() => {
		if (!isResizing) return

		function onMouseMove(e: MouseEvent) {
			if (!beginCoords.current || !contRect.current) return

			const diffX = (e.clientX - beginCoords.current.x) / contRect.current.width
			const diffY = (e.clientY - beginCoords.current.y) / contRect.current.height

			const newValue = Math.max(0, Math.min(1, initialPos.current + diffX))

			onChange?.({
				value: newValue,
			})

			e.preventDefault()
		}

		function onMouseUp(e: MouseEvent) {
			setIsResizing(false)
		}

		window.addEventListener('mousemove', onMouseMove, {
			capture: true,
		})
		window.addEventListener('mouseup', onMouseUp, {
			once: true,
			capture: true,
		})

		return () => {
			window.removeEventListener('mousemove', onMouseMove, {
				capture: true,
			})
			window.removeEventListener('mouseup', onMouseUp, {
				capture: true,
			})
		}
	}, [isResizing, onChange])

	useEffect(() => {
		if (isResizing) return

		initialPos.current = defaultedPosition
	}, [isResizing, defaultedPosition])

	return (
		<div className={`${className ?? ''} ${classes.SplitPane}`} style={style} ref={container}>
			<div className={classes.PaneA}>{childrenBegin}</div>
			<div className={isResizing ? classes.DividerActive : classes.Divider} onMouseDown={onMouseDown}></div>
			<div className={classes.PaneB}>{childrenEnd}</div>
		</div>
	)
}

type ChangeEvent = { value: number }
type ChangeEventHandler = (e: ChangeEvent) => void
