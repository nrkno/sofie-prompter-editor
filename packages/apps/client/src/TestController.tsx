import React from 'react'
import { APIConnection } from './api/ApiConnection.ts'
import { OutputSettings } from '@sofie-prompter-editor/shared-model'
import { EditObject, useApiConnection } from './TestUtil.tsx'

export const TestController: React.FC<{ api: APIConnection }> = ({ api }) => {
	const [ready, setReady] = React.useState(false)
	const [connected, setConnected] = React.useState(false)
	const [outputSettings, setOutputSettings] = React.useState<OutputSettings | null>(null)

	useApiConnection(
		(connected) => {
			if (!connected) {
				setConnected(false)
				return
			}
			setConnected(true)

			api.outputSettings
				.subscribeToController()
				.then(() => {
					setReady(true)
				})
				.catch(console.error)

			api.outputSettings.on('created', (data) => {
				setOutputSettings(data)
			})
			api.outputSettings.on('updated', (data) => {
				setOutputSettings(data)
			})

			// Also fetch initial settings:
			api.outputSettings
				.get('')
				.then((data) => {
					setOutputSettings(data)
				})
				.catch(console.error)
		},
		api,
		[]
	)

	return (
		<div style={{ border: '1em solid #666' }}>
			<h1>Controller</h1>
			<div>Connection status: {connected ? <span>Connected</span> : <span>Not connected</span>}</div>
			<div>Subscription status: {ready ? <span>Ready</span> : <span>Not ready</span>}</div>

			{ready && outputSettings && (
				<div>
					<EditObject
						obj={outputSettings}
						onChange={(newData) => {
							api.outputSettings.update('', newData).catch(console.error)
						}}
					/>
				</div>
			)}
		</div>
	)
}
