import { observer } from 'mobx-react-lite'
import React, { useEffect, useMemo, useRef } from 'react'
import { RundownOutput } from 'src/components/RundownOutput/RundownOutput'
import { RootAppStore } from 'src/stores/RootAppStore'

import classes from './PreviewPanel.module.scss'
import { useSize } from 'src/lib/useSize'
import { useControllerMessages } from 'src/hooks/useControllerMessages'
import { useKeepRundownOutputInPosition } from 'src/hooks/useKeepRundownOutputInPosition'

export const PreviewPanel = observer(function PreviewPanel(): React.ReactNode {
	const rootEl = useRef<HTMLDivElement>(null)

	useEffect(() => {
		RootAppStore.outputSettingsStore.initialize()
		RootAppStore.viewportStore.initialize()
	}, [])

	const rundown = RootAppStore.rundownStore.openRundown
	const outputSettings = RootAppStore.outputSettingsStore.outputSettings

	const rundownIsInOutput =
		outputSettings.activeRundownPlaylistId !== null && rundown?.id === outputSettings.activeRundownPlaylistId

	const viewPortAspectRatio = RootAppStore.viewportStore.viewPort.aspectRatio

	const lastKnownState = RootAppStore.viewportStore.viewPort.lastKnownState

	const fontSize = outputSettings.fontSize

	const size = useSize(rootEl)
	const previewWidth = size?.width ?? 0

	const { setBaseViewPortState: setBaseState, position } = useControllerMessages(
		rootEl,
		(previewWidth * fontSize) / 100,
		{
			enableControl: rundownIsInOutput,
		}
	)
	useKeepRundownOutputInPosition(rootEl, rundown, position, 0)

	useEffect(() => {
		if (!lastKnownState) return
		if (!rundownIsInOutput) return

		setBaseState(lastKnownState)
	}, [rundownIsInOutput, setBaseState, lastKnownState])

	const style = useMemo(
		() =>
			({
				'--prompter-font-size-base': `${(previewWidth * fontSize) / 100}px`,
				height: `${previewWidth / viewPortAspectRatio}px`,
			} as React.CSSProperties),
		[fontSize, previewWidth, viewPortAspectRatio]
	)

	return (
		<div className={`Prompter ${classes.PreviewPanel} bg-black`} ref={rootEl} style={style}>
			{rundown && <RundownOutput rundown={rundown} />}
		</div>
	)
})
PreviewPanel.displayName = 'PreviewPanel'
