import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Editor } from './Editor'

import 'src/PrompterStyles.css'
import classes from './ScriptEditor.module.scss'
import { observer } from 'mobx-react-lite'
import { RootAppStore } from 'src/stores/RootAppStore'
import { useDebouncedCallback } from 'src/lib/lib'
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

	return (
		<div className={`bg-black Prompter ${classes.ScriptEditor}`} style={style} ref={rootEl}>
			<Editor />
			<div className="spacer" />
		</div>
	)
})
ScriptEditor.displayName = 'ScriptEditor'
