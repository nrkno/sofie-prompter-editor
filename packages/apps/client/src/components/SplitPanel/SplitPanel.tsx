import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import classes from './SplitPanel.module.css'

export function SplitPanel({
	position,
	onChange,
	childrenBegin,
	childrenEnd,
	className,
	classNameBegin,
	classNameEnd,
}: {
	className?: string
	position?: number
	onChange?: ChangeEventHandler
	childrenBegin: ReactNode
	childrenEnd: ReactNode
	children?: null
	classNameBegin?: string
	classNameEnd?: string
}) {
	const [isResizing, setIsResizing] = useState(false)
	const beginCoords = useRef<{ x: number; y: number } | null>(null)
	const initialPos = useRef<number>(position ?? 0.5)
	const container = useRef<HTMLDivElement>(null)
	const divider = useRef<HTMLDivElement>(null)
	const contRect = useRef<DOMRect | null>(null)

	const defaultedPosition = position ?? 0.5

	function onMouseDown(e: React.MouseEvent) {
		if (e.button !== 0) return
		setIsResizing(true)
		beginCoords.current = { x: e.clientX, y: e.clientY }
		contRect.current = container.current?.getBoundingClientRect() ?? null
		e.preventDefault()
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
			// const diffY = (e.clientY - beginCoords.current.y) / contRect.current.height

			const newValue = Math.max(0, Math.min(1, initialPos.current + diffX))

			onChange?.({
				value: newValue,
			})

			e.preventDefault()
		}

		function onMouseUp(e: MouseEvent) {
			if (e.button !== 0) return
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

	useEffect(() => {
		if (isResizing) {
			if (!divider.current) return
			const style = window.getComputedStyle(divider.current)
			document.body.style.cursor = style.cursor
		} else {
			document.body.style.cursor = ''
		}

		return () => {
			document.body.style.cursor = ''
		}
	}, [isResizing])

	return (
		<div className={`${className ?? ''} ${classes.SplitPane}`} style={style} ref={container}>
			<div className={`${classes.PaneA}  ${classNameBegin ?? ''}`}>{childrenBegin}</div>
			<div
				className={isResizing ? classes.DividerActive : classes.Divider}
				ref={divider}
				onMouseDown={onMouseDown}
			></div>
			<div className={`${classes.PaneB} ${classNameEnd ?? ''}`}>{childrenEnd}</div>
		</div>
	)
}

type ChangeEvent = { value: number }
type ChangeEventHandler = (e: ChangeEvent) => void
