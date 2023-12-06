import React from 'react'
import { APIConnection } from './api/ApiConnection.ts'
import { PrompterSettings } from '@sofie-prompter-editor/shared-model'
import { EditObject, EditValue, useApiConnection } from './TestUtil.tsx'

export const TestController: React.FC<{ api: APIConnection }> = ({ api }) => {
	const [ready, setReady] = React.useState(false)
	const [connected, setConnected] = React.useState(false)
	const [prompterSettings, setPrompterSettings] = React.useState<PrompterSettings | null>(null)

	useApiConnection(
		(connected) => {
			if (!connected) {
				setConnected(false)
				return
			}
			setConnected(true)

			api.prompterSettings
				.subscribeToController()
				.then(() => {
					setReady(true)
				})
				.catch(console.error)

			api.prompterSettings.on('created', (data) => {
				setPrompterSettings(data)
			})
			api.prompterSettings.on('updated', (data) => {
				setPrompterSettings(data)
			})

			// Also fetch initial settings:
			api.prompterSettings
				.get('')
				.then((data) => {
					setPrompterSettings(data)
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

			{ready && prompterSettings && (
				<div>
					<EditObject
						obj={prompterSettings}
						onChange={(newData) => {
							api.prompterSettings.update('', newData)
						}}
					/>
				</div>
			)}
		</div>
	)
}
