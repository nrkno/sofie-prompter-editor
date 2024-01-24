import { observer } from 'mobx-react-lite'
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { RundownOutput } from 'src/components/RundownOutput/RundownOutput'
import { RootAppStore } from 'src/stores/RootAppStore'

import classes from './PreviewPanel.module.scss'
import { useSize } from 'src/lib/useSize'

export const PreviewPanel = observer(function PreviewPanel(): React.ReactNode {
	const rootEl = useRef<HTMLDivElement>(null)

	useEffect(() => {
		RootAppStore.outputSettingsStore.initialize()
		RootAppStore.viewportStore.initialize()
	}, [])

	const rundown = RootAppStore.rundownStore.openRundown
	const outputSettings = RootAppStore.outputSettingsStore.outputSettings

	const viewPortAspectRatio = RootAppStore.viewportStore.viewPort.aspectRatio

	const size = useSize(rootEl)
	const previewWidth = size?.width ?? 0

	const style = useMemo(
		() =>
			({
				'--prompter-font-size-base': `${(previewWidth * outputSettings.fontSize) / 100}px`,
				height: `${previewWidth / viewPortAspectRatio}px`,
			} as React.CSSProperties),
		[outputSettings.fontSize, previewWidth, viewPortAspectRatio]
	)

	return (
		<div className={`Prompter ${classes.PreviewPanel} bg-black`} ref={rootEl} style={style}>
			{rundown && <RundownOutput rundown={rundown} />}
		</div>
	)
})
PreviewPanel.displayName = 'PreviewPanel'
