import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { RootAppStore } from 'src/stores/RootAppStore.ts'

import 'src/PrompterStyles.css'
import { Helmet } from 'react-helmet-async'
import { RundownOutput } from 'src/components/RundownOutput/RundownOutput'
import { getCurrentTime } from 'src/lib/getCurrentTime'
import { useQueryParam } from 'src/lib/useQueryParam'

import classes from './Output.module.scss'
import { useControllerMessages } from 'src/hooks/useControllerMessages'

const Output = observer(function Output(): React.ReactElement {
	const rootEl = useRef<HTMLDivElement>(null)
	const [size, setSize] = useState({ height: window.innerHeight, width: window.innerWidth })

	const isPrimary = useQueryParam('primary') !== null

	// On startup
	useEffect(() => {
		RootAppStore.outputSettingsStore.initialize() // load and subscribe
	})

	const outputSettings = RootAppStore.outputSettingsStore.outputSettings

	const fontSize = outputSettings.fontSize
	const scaleVertical = outputSettings.mirrorVertically ? '-1' : '1'
	const scaleHorizontal = outputSettings.mirrorHorizontally ? '-1' : '1'

	useControllerMessages(rootEl, size.height, (fontSize * size.width) / 100)

	const onViewPortSizeChanged = useCallback(() => {
		const width = window.innerWidth
		const height = window.innerHeight
		const aspectRatio = width / height
		setSize({ width, height })

		if (!isPrimary) return

		RootAppStore.connection.viewPort.update(null, {
			_id: '',
			aspectRatio,
			// TODO: This should return the actual lastKnownState
			lastKnownState: {
				timestamp: getCurrentTime(),
				controllerMessage: {
					offset: null,
					speed: 0,
				},
			},
		})
	}, [isPrimary])

	useEffect(() => {
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

	const rundown = RootAppStore.rundownStore.openRundown

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
				'--prompter-font-size-base': `${fontSize}vw`,
				transform: `scale(${scaleHorizontal}, ${scaleVertical})`,
			} as React.CSSProperties),
		[fontSize, scaleVertical, scaleHorizontal]
	)

	const className = `Prompter ${classes.Output}`

	if (!rundown) {
		return (
			<>
				{GLOBAL_SETTINGS}
				<div className={className}></div>
			</>
		)
	}

	return (
		<>
			{GLOBAL_SETTINGS}
			<div className={className} style={styleVariables} ref={rootEl}>
				<RundownOutput rundown={rundown} />
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
