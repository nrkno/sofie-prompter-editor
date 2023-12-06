import React from 'react'
import { APIConnection } from './api/ApiConnection.ts'
import { ViewPort } from '@sofie-prompter-editor/shared-model'
import { EditObject, EditValue, useApiConnection } from './TestUtil.tsx'

export const TestViewPort: React.FC<{ api: APIConnection }> = ({ api }) => {
	const [ready, setReady] = React.useState(false)
	const [connected, setConnected] = React.useState(false)
	const [viewPort, setViewPort] = React.useState<ViewPort | null>(null)

	useApiConnection(
		(connected) => {
			if (!connected) {
				setConnected(false)
				return
			}
			setConnected(true)

			api.viewPort
				.subscribeToViewPort()
				.then(() => {
					setReady(true)
				})
				.catch(console.error)

			api.viewPort.on('created', (data) => {
				setViewPort(data)
			})
			api.viewPort.on('updated', (data) => {
				setViewPort(data)
			})

			// Also fetch initial settings:
			api.viewPort
				.get('viewport')
				.then((data) => {
					setViewPort(data)
				})
				.catch(console.error)
		},
		api,
		[]
	)

	return (
		<div style={{ border: '1em solid #966' }}>
			<h1>ViewPort</h1>
			<div>Connection status: {connected ? <span>Connected</span> : <span>Not connected</span>}</div>
			<div>Subscription status: {ready ? <span>Ready</span> : <span>Not ready</span>}</div>

			{ready && viewPort && (
				<div>
					<EditObject
						obj={viewPort}
						onChange={(newViewPort) => {
							api.viewPort.update('viewport', newViewPort)
						}}
					/>
				</div>
			)}
		</div>
	)
}
