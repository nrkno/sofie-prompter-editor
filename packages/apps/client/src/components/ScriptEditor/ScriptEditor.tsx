import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Editor } from './Editor'

import 'src/PrompterStyles.css'
import classes from './ScriptEditor.module.scss'
import { observer } from 'mobx-react-lite'
import { RootAppStore } from 'src/stores/RootAppStore'
import { useDebouncedCallback } from 'src/lib/lib'

export const ScriptEditor = observer(function ScriptEditor(): React.JSX.Element {
	const [fontSize, setFontSize] = useState(10)
	const [width, setWidth] = useState<number | null>(null)

	const rootEl = useRef<HTMLDivElement>(null)

	useEffect(() => {
		RootAppStore.outputSettingsStore.initialize()
	}, [])

	const viewportFontSize = RootAppStore.outputSettingsStore.outputSettings.fontSize

	useEffect(() => {
		if (width === null) return

		setFontSize((width * viewportFontSize) / 100)
	}, [viewportFontSize, width])

	const dividerSplitPosition = RootAppStore.uiStore.viewDividerPosition

	const onResize = useDebouncedCallback(
		function onResize() {
			if (!rootEl.current) return
			const { width: elementWidth } = rootEl.current.getBoundingClientRect()

			setWidth(elementWidth)
		},
		[],
		{
			delay: 100,
		}
	)

	useLayoutEffect(() => {
		void dividerSplitPosition
		onResize()
	}, [dividerSplitPosition, onResize])

	useEffect(() => {
		window.addEventListener('resize', onResize)

		return () => {
			window.removeEventListener('resize', onResize)
		}
	}, [onResize])

	const style = useMemo(
		() =>
			({
				'--prompter-font-size-base': `${fontSize}px`,
			} as React.CSSProperties),
		[fontSize]
	)

	return (
		<div className={`bg-black Prompter ${classes.ScriptEditor}`} style={style} ref={rootEl}>
			<Editor />
		</div>
	)
})
ScriptEditor.displayName = 'ScriptEditor'
