import React, { useCallback, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { APIConnection } from 'src/api/ApiConnection.ts'
import { OutputSettings } from '@sofie-prompter-editor/shared-model'
import { EditObject, useApiConnection } from 'src/views/TestController/TestUtil'
import { RootAppStore } from 'src/stores/RootAppStore.ts'
import { autorun, computed, toJS } from 'mobx'

const TestController: React.FC = observer(() => {
	// const [ready, setReady] = React.useState(false)
	// const [connected, setConnected] = React.useState(false)
	// const [outputSettings, setOutputSettings] = React.useState<OutputSettings | null>(null)

	// On startup
	useEffect(() => {
		RootAppStore.outputSettingsStore.initialize() // load and subscribe
	}, [])
	const outputSettings = RootAppStore.outputSettingsStore.outputSettings

	const systemStatus = toJS(RootAppStore.systemStatusStore.systemStatus)

	// useApiConnection(
	// 	(connected) => {
	// 		if (!connected) {
	// 			setConnected(false)
	// 			return
	// 		}
	// 		setConnected(true)

	// 		api.outputSettings
	// 			.subscribe()
	// 			.then(() => {
	// 				setReady(true)
	// 			})
	// 			.catch(console.error)

	// 		// api.outputSettings.on('created', (data) => {
	// 		// 	setOutputSettings(data)
	// 		// })
	// 		api.outputSettings.on('updated', (data) => {
	// 			setOutputSettings(data)
	// 		})

	// 		// Also fetch initial settings:
	// 		api.outputSettings
	// 			.get('')
	// 			.then((data) => {
	// 				setOutputSettings(data)
	// 			})
	// 			.catch(console.error)
	// 	},
	// 	api,
	// 	[]
	// )

	// return (
	// 	<div style={{ border: '1em solid #666' }}>
	// 		<h1>Controller</h1>
	// 		<div>Connection status: {connected ? <span>Connected</span> : <span>Not connected</span>}</div>
	// 		<div>Subscription status: {ready ? <span>Ready</span> : <span>Not ready</span>}</div>

	// 		{ready && outputSettings && (
	// 			<div>
	// 				<EditObject
	// 					obj={outputSettings}
	// 					onChange={(newData) => {
	// 						api.outputSettings.update('', newData).catch(console.error)
	// 					}}
	// 				/>
	// 			</div>
	// 		)}
	// 	</div>
	// )

	const sendSpeed = useCallback((speed: number) => {
		RootAppStore.connection.controller
			.sendMessage({
				offset: null,
				speed: speed,
			})
			.catch(console.error)
	}, [])

	return (
		<>
			<h1>Test controller</h1>
			<div>
				<h3>SystemStatus</h3>
				<div>{JSON.stringify(systemStatus, null, 2)}</div>
			</div>
			<div>
				<h3>Settings</h3>
				<div>
					{outputSettings ? (
						<EditObject
							obj={outputSettings}
							onChange={(newData) => {
								RootAppStore.connection.outputSettings.update(null, newData).catch(console.error)
							}}
						/>
					) : (
						<span>loading...</span>
					)}
				</div>
			</div>
			<div>
				<h3>Control the output</h3>
				<div>
					<button onClick={() => sendSpeed(-3)}>Speed: -3</button>
					<button onClick={() => sendSpeed(0)}>Speed: 0</button>
					<button onClick={() => sendSpeed(3)}>Speed: 3</button>
				</div>
			</div>
		</>
	)
})
TestController.displayName = 'TestController'

export default TestController
