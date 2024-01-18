import React, { useEffect, useMemo, useReducer, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { AppStore } from '../stores/AppStore'

const Output = observer(function Output() {
	const speed = useRef(0)

	// On startup
	useEffect(() => {
		AppStore.outputSettingsStore.initialize() // load and subscribe

		AppStore.connection.controller.on('message', (message) => {
			console.log('received message', message)

			speed.current = message.speed
		})
		AppStore.connection.controller.subscribeToMessages().catch(console.error)

		// don't do this, it's just for testing:
		const interval = setInterval(() => {
			window.scrollBy(0, speed.current)
		}, 1000 / 60)
		return () => {
			AppStore.connection.controller.off('message')
			clearInterval(interval)
		}
	}, [])

	const outputSettings = AppStore.outputSettingsStore.outputSettings

	const activeRundownPlaylistId = outputSettings?.activeRundownPlaylistId

	useEffect(() => {
		if (activeRundownPlaylistId) {
			AppStore.rundownStore.loadRundown(activeRundownPlaylistId)
		} else {
			// TODO: unload rundown?
		}
	}, [activeRundownPlaylistId])

	const rundown = AppStore.rundownStore.openRundown

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
	const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum`
	const dummyContent: string[] = []
	for (let i = 0; i < 100; i++) {
		dummyContent.push(loremIpsum)
	}

	return (
		<>
			<h1>Prompter output</h1>
			<div>Initialized: {AppStore.outputSettingsStore.initialized ? 'YES' : 'NO'}</div>
			<div>{JSON.stringify(outputSettings)}</div>

			<div>{rundown ? <>Rundown: {rundown.name}</> : <>No active rundown</>}</div>

			<div>
				{dummyContent.map((line, i) => (
					<div
						key={i}
						style={{
							margin: '1em',
						}}
					>
						{line}
					</div>
				))}
			</div>
		</>
	)
})
Output.displayName = 'Output'

export default Output
