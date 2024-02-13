import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Editor } from './Editor'

import 'src/PrompterStyles.css'
import classes from './ScriptEditor.module.scss'
import { observer } from 'mobx-react-lite'
import { RootAppStore } from 'src/stores/RootAppStore'
import { useSize } from 'src/lib/useSize'

export const ScriptEditor = observer(function ScriptEditor(): React.JSX.Element {
	const [fontSize, setFontSize] = useState(10)

	const rootEl = useRef<HTMLDivElement>(null)

	useEffect(() => {
		RootAppStore.outputSettingsStore.initialize()
	}, [])

	const viewportFontSize = RootAppStore.outputSettingsStore.outputSettings.fontSize

	const size = useSize(rootEl)
	const width = size?.width

	useEffect(() => {
		if (width === undefined) return

		setFontSize((width * viewportFontSize) / 100)
	}, [viewportFontSize, width])

	const style = useMemo(
		() =>
			({
				'--prompter-font-size-base': `${fontSize}px`,
			} as React.CSSProperties),
		[fontSize]
	)

	function onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
		if (!rootEl.current) return
		if (!(!e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey)) return

		switch (e.code) {
			case 'ArrowUp':
				scrollContainerWithCaret(rootEl.current, 'up')
				e.preventDefault()
				break
			case 'ArrowDown':
				scrollContainerWithCaret(rootEl.current, 'down')
				e.preventDefault()
				break
		}
	}

	return (
		<div className={`bg-black Prompter ${classes.ScriptEditor}`} style={style} ref={rootEl} onKeyDown={onKeyDown}>
			<Editor />
			<div className="spacer" />
		</div>
	)
})
ScriptEditor.displayName = 'ScriptEditor'

function scrollContainerWithCaret(container: HTMLElement, upOrDown: 'up' | 'down') {
	const backwardsForwards = upOrDown === 'down' ? 'forward' : 'backward'
	const currentSelection = window.getSelection()
	if (!currentSelection) return
	const bounds = getSelectionRangeClientRect(currentSelection.getRangeAt(0))
	if (!bounds) return

	currentSelection.modify('move', backwardsForwards, 'line')
	const modifiedSelection = window.getSelection()
	if (!modifiedSelection) return
	const modifiedBounds = getSelectionRangeClientRect(modifiedSelection.getRangeAt(0))
	if (!modifiedBounds) return

	let scrollAmount = modifiedBounds.top - bounds.top
	if (scrollAmount === 0) {
		if (modifiedBounds.left !== bounds.left) {
			scrollAmount = modifiedBounds.left < bounds.left ? -19 : 19
		}
	}

	container.scrollBy({
		top: scrollAmount,
		behavior: 'instant',
	})
}

function getSelectionRangeClientRect(range: Range): DOMRect | null {
	let bounds = range.getBoundingClientRect()
	if (bounds.top === 0 && bounds.bottom === 0) {
		if (!(range.startContainer instanceof HTMLElement)) return null
		bounds = range.startContainer.getBoundingClientRect()
	}
	return bounds
}
