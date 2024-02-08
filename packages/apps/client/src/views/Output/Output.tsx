import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { RootAppStore } from 'src/stores/RootAppStore.ts'

import 'src/PrompterStyles.css'
import { Helmet } from 'react-helmet-async'
import { RundownOutput } from 'src/components/RundownOutput/RundownOutput'
import { getCurrentTime } from 'src/lib/getCurrentTime'
import { useQueryParam } from 'src/lib/useQueryParam'

import classes from './Output.module.scss'
import { useControllerMessages } from 'src/hooks/useControllerMessages'
import { reaction, toJS } from 'mobx'
import {
	PartId,
	SegmentId,
	TextMarkerId,
	ViewPortLastKnownState,
	ViewPortState,
	protectString,
} from '@sofie-prompter-editor/shared-model'
import { UpdateProps, useKeepRundownOutputInPosition } from 'src/hooks/useKeepRundownOutputInPosition'
import { combineDisposers } from 'src/lib/lib'

type AnyElementId = SegmentId | PartId | TextMarkerId

function createState(
	rootEl: HTMLElement,
	fontSizePx: number,
	speed: number,
	target: {
		element: HTMLElement
		offset: number
	} | null
): ViewPortLastKnownState {
	// TODO: Find an anchoring point closest to the "focus area",
	// and use that as opposed to the "top of page" null value
	let targetEl = null
	let offset = 0

	if (target !== null) {
		targetEl = protectString<AnyElementId>(target.element.dataset['objId']) ?? null
		offset = target.offset / fontSizePx
	}

	if (targetEl === null) {
		offset = rootEl.scrollTop / fontSizePx
		if (!Number.isFinite(offset)) offset = 0
	}

	return {
		timestamp: getCurrentTime(),
		controllerMessage: {
			speed,
			offset: {
				target: targetEl,
				offset,
			},
		},
	}
}

const Output = observer(function Output(): React.ReactElement {
	const rootEl = useRef<HTMLDivElement>(null)
	const bootTime = useMemo(() => getCurrentTime(), [])
	const [size, setSize] = useState({ height: window.innerHeight, width: window.innerWidth })

	const isPrimary = useQueryParam('primary') !== null

	// On startup
	useEffect(
		() =>
			combineDisposers(
				RootAppStore.whenConnected(() => RootAppStore.outputSettingsStore.initialize()),
				RootAppStore.whenConnected(() => RootAppStore.viewportStore.initialize())
			),
		[]
	)

	const outputSettings = RootAppStore.outputSettingsStore.outputSettings

	const fontSize = outputSettings.fontSize
	const scaleVertical = outputSettings.mirrorVertically ? '-1' : '1'
	const scaleHorizontal = outputSettings.mirrorHorizontally ? '-1' : '1'

	const fontSizePx = (fontSize * size.width) / 100

	const onStateChange = useCallback(
		(viewPortState: ViewPortState) => {
			if (!isPrimary) return
			if (!rootEl.current) return
			const aspectRatio = size.width / size.height

			const state = createState(rootEl.current, fontSizePx, viewPortState.speed, null)

			RootAppStore.viewportStore.update(aspectRatio, state)
		},
		[rootEl, size, fontSizePx, isPrimary]
	)

	const rundown = RootAppStore.rundownStore.openRundown

	const {
		lastKnownState: viewportState,
		setBaseViewPortState: setLastKnownState,
		position,
		speed,
	} = useControllerMessages(rootEl, fontSizePx, {
		onStateChange,
	})

	const onUpdate = useCallback(
		(change: UpdateProps) => {
			if (!isPrimary) return
			if (!rootEl.current) return
			const aspectRatio = size.width / size.height

			const state = createState(rootEl.current, fontSizePx, viewportState.current?.controllerMessage.speed ?? 0, {
				element: change.element,
				offset: change.offset,
			})

			RootAppStore.viewportStore.update(aspectRatio, state)
		},
		[rootEl, size, fontSizePx, isPrimary, viewportState]
	)

	useKeepRundownOutputInPosition(rootEl, rundown, fontSizePx, speed, position, 0, {
		onUpdate,
	})

	const viewPortLastKnownState = RootAppStore.viewportStore.viewPort.lastKnownState

	useEffect(
		() =>
			reaction(
				() => RootAppStore.rundownStore.openRundown?.id,
				() => {
					if (!isPrimary) return
					setLastKnownState({
						controllerMessage: {
							offset: {
								target: null,
								offset: 0,
							},
							speed: 0,
						},
						timestamp: getCurrentTime(),
					})
				},
				{
					fireImmediately: false,
				}
			),
		[setLastKnownState, isPrimary]
	)

	useEffect(() => {
		if (!viewPortLastKnownState) return
		if (isPrimary && viewPortLastKnownState.timestamp > bootTime) return

		setLastKnownState(toJS(viewPortLastKnownState))
	}, [bootTime, isPrimary, viewPortLastKnownState, setLastKnownState])

	const onViewPortSizeChanged = useCallback(() => {
		if (!rootEl.current) return
		const width = window.innerWidth
		const height = window.innerHeight
		setSize({ width, height })

		const aspectRatio = width / height

		if (!isPrimary) return

		const state = createState(rootEl.current, fontSizePx, viewportState.current?.controllerMessage.speed ?? 0, null)

		RootAppStore.viewportStore.update(aspectRatio, state)
	}, [rootEl, fontSizePx, viewportState, isPrimary])

	useLayoutEffect(() => {
		window.addEventListener('resize', onViewPortSizeChanged)

		onViewPortSizeChanged()

		return () => {
			window.removeEventListener('resize', onViewPortSizeChanged)
		}
	}, [onViewPortSizeChanged])

	const activeRundownPlaylistId = outputSettings?.activeRundownPlaylistId

	useEffect(() => {
		if (activeRundownPlaylistId) {
			RootAppStore.rundownStore.loadRundown(activeRundownPlaylistId)
		} else {
			// TODO: unload rundown?
		}
	}, [activeRundownPlaylistId])

	/*
	Implementation notes:


	appStore.controller.subscribe()
	// THIS WILL BE AN EVENT, not reactive!
	appStore.controller.on('message', handleControllerMessage)

	const [viewPort, setViewPort] = useState<{
		timestamp: number
		startinPosition: number
		speed: number
	}>(0)

	const isPrimary = getURLParam('isPrimary')

	// const viewPortId = random.id()

	// restore position on window reload
	const viewPort = await appStore.viewPort.get()
	handleControllerMessage(viewPort.lastKnownPosition)

	if (!isPrimary) {
		// Follow the primary viewport:

		appStore.viewPort.subscribe()
		appStore.viewPort.on('update', (viewPort) => {

			// viewPort.lastKnownPosition.timestamp
			// viewPort.lastKnownPosition.position
			// viewPort.lastKnownPosition.speed

			// if (position-)

			// const currentPosition = viewPort.startingPosition + viewPort.speed * (getCurrentTime() - viewPort.timestamp)

			handleControllerMessage(viewPort.lastKnownPosition)
		})

	}

	function handleControllerMessage(msg: ControllerMessage) {
		setViewport.timestamp(msg.timestamp ?? getCurrentTime())
		if (msg.position) {
			setViewport.startinPosition = msg.position
		}
		setViewport.speed = msg.speed
	}
	onEveryFrame(() => {
		const currentPosition = viewPort.startingPosition + viewPort.speed * (getCurrentTime() - viewPort.timestamp)
		scrollTo(currentPosition)
	})
	useEffect(() => {
		if (!isPrimary) return

		reportViewPortState(viewPort)
	}, [isPrimary, viewPort])




	*/

	const styleVariables = useMemo(
		() =>
			({
				'--prompter-font-size-base': `${(fontSize * size.width) / 100}px`,
				transform: `scale(${scaleHorizontal}, ${scaleVertical})`,
			} as React.CSSProperties),
		[fontSize, size.width, scaleVertical, scaleHorizontal]
	)

	const className = `Prompter ${classes.Output}`

	return (
		<>
			{GLOBAL_SETTINGS}
			<div className={className} style={styleVariables} ref={rootEl}>
				{rundown && <RundownOutput rundown={rundown} />}
			</div>
		</>
	)
})
Output.displayName = 'Output'

const GLOBAL_SETTINGS = (
	<Helmet>
		<title>Output</title>
		<body data-bs-theme="dark" className="bg-black" />
	</Helmet>
)

export default Output
