import { observer } from 'mobx-react-lite'
import React, { useEffect, useMemo, useRef } from 'react'
import { RundownOutput } from 'src/components/RundownOutput/RundownOutput'
import { RootAppStore } from 'src/stores/RootAppStore'

import classes from './PreviewPanel.module.scss'
import { useSize } from 'src/lib/useSize'
import { useControllerMessages } from 'src/hooks/useControllerMessages'
import { useKeepRundownOutputInPosition } from 'src/hooks/useKeepRundownOutputInPosition'
import { combineDisposers } from 'src/lib/lib'
import { getAllAnchorElementsByType, getAnchorAbovePositionIndex } from 'src/lib/anchorElements'
import { PartId, protectString } from '@sofie-prompter-editor/shared-model'

const PREVIEW_SAMPLE_RATE = 250

export const PreviewPanel = observer(function PreviewPanel(): React.ReactNode {
	const rootEl = useRef<HTMLDivElement>(null)

	useEffect(
		() =>
			combineDisposers(
				RootAppStore.whenConnected(() => RootAppStore.outputSettingsStore.initialize()),
				RootAppStore.whenConnected(() => RootAppStore.viewportStore.initialize())
			),
		[]
	)

	const rundown = RootAppStore.rundownStore.openRundown
	const outputSettings = RootAppStore.outputSettingsStore.outputSettings

	const rundownIsInOutput =
		outputSettings.activeRundownPlaylistId !== null && rundown?.id === outputSettings.activeRundownPlaylistId

	const viewPortAspectRatio = RootAppStore.viewportStore.viewPort.aspectRatio

	const lastKnownState = RootAppStore.viewportStore.viewPort.lastKnownState

	const fontSize = outputSettings.fontSize

	const size = useSize(rootEl)
	const previewWidth = size?.width ?? 0

	const fontSizePx = (previewWidth * fontSize) / 100

	const focusPosition = 0

	const {
		setBaseViewPortState: setBaseState,
		scrolledPosition,
		position,
		speed,
	} = useControllerMessages(rootEl, fontSizePx, {
		enableControl: rundownIsInOutput,
	})
	useKeepRundownOutputInPosition(rootEl, rundown, fontSizePx, speed, scrolledPosition, position, focusPosition)

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

	const markerStyle = useMemo(
		() =>
			({
				'--prompter-font-size-base': `${(previewWidth * fontSize) / 100}px`,
			} as React.CSSProperties),
		[fontSize, previewWidth]
	)

	useEffect(() => {
		const interval = setInterval(() => {
			if (!rundown) return
			if (!rootEl.current) return
			const els = Array.from(getAllAnchorElementsByType(rootEl.current, 'line'))
			const anchorAbovePositionIndex = getAnchorAbovePositionIndex(focusPosition, els)

			const selectedEl = els[anchorAbovePositionIndex]
			if (!selectedEl || !(selectedEl instanceof HTMLElement)) {
				rundown.updatePartInOutput(null)
				return
			}
			const uiLineId = protectString<PartId>(selectedEl.dataset['objId']) ?? null
			rundown.updatePartInOutput(uiLineId)
		}, PREVIEW_SAMPLE_RATE)

		return () => {
			clearInterval(interval)
		}
	}, [rundown])

	return (
		<>
			<div className={`Prompter ${classes.PreviewPanel} bg-black`} ref={rootEl} style={style}>
				{rundown && <RundownOutput rundown={rundown} />}
			</div>
			<div className="PrompterMarker" style={markerStyle} />
		</>
	)
})
PreviewPanel.displayName = 'PreviewPanel'
