import React, { useCallback, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { RootAppStore } from 'src/stores/RootAppStore.ts'

import 'src/PrompterStyles.css'
import { Segment } from './Segment'
import { Helmet } from 'react-helmet-async'
import { getCurrentTime } from 'src/lib/getCurrentTime'
import { useQueryParam } from 'src/lib/useQueryParam'

const Output = observer(function Output(): React.ReactElement {
	const speed = useRef(0)

	const isPrimary = useQueryParam('primary') !== null

	// On startup
	useEffect(() => {
		RootAppStore.outputSettingsStore.initialize() // load and subscribe

		RootAppStore.connection.controller.on('message', (message) => {
			console.log('received message', message)

			speed.current = message.speed
		})
		RootAppStore.connection.controller.subscribeToMessages().catch(console.error)

		// don't do this, it's just for testing:
		const interval = setInterval(() => {
			window.scrollBy(0, speed.current)
		}, 1000 / 60)

		return () => {
			RootAppStore.connection.controller.off('message')
			clearInterval(interval)
		}
	}, [])

	const onViewPortSizeChanged = useCallback(() => {
		if (!isPrimary) return

		RootAppStore.connection.viewPort.update('', {
			_id: '',
			width: window.innerWidth / window.innerHeight,
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

	const outputSettings = RootAppStore.outputSettingsStore.outputSettings

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

	if (!rundown) {
		return (
			<>
				{GLOBAL_SETTINGS}
				<div className="Prompter"></div>
			</>
		)
	}

	return (
		<>
			{GLOBAL_SETTINGS}
			<div className="Prompter">
				<h1>{rundown.name}</h1>
				{rundown.segmentsInOrder.map((segment) => (
					<Segment key={segment.id} segment={segment} />
				))}
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
