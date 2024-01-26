import { observer } from 'mobx-react-lite'
import React from 'react'
import { RootAppStore } from 'src/stores/RootAppStore'
import { AlertBar } from 'src/components/AlertBar/AlertBar'
import { Button } from 'react-bootstrap'

export const SystemStatusAlertBars = observer(function SystemStatusAlertBars(): React.JSX.Element {
	const isAPIConnected = RootAppStore.connected
	const isSofieConnected = RootAppStore.sofieConnected

	const hidAccessRequest = Array.from(RootAppStore.triggerStore.hidDeviceAccessRequests.values())[0]

	let requestAccess: {
		name: string
		allow: () => void
		deny: () => void
	} | null = null
	if (hidAccessRequest) {
		requestAccess = {
			name: hidAccessRequest.deviceName,
			allow: () => hidAccessRequest.callback(true),
			deny: () => hidAccessRequest.callback(false),
		}
	}

	return (
		<>
			{!isAPIConnected ? <AlertBar variant="danger">Prompter is having network troubles</AlertBar> : null}
			{!isSofieConnected ? <AlertBar variant="danger">Prompter is having trouble connecting to Sofie</AlertBar> : null}
			{requestAccess ? (
				<AlertBar variant="info">
					Please allow access to {requestAccess.name} to setup shortcuts:
					<Button variant="primary" onClick={requestAccess.allow}>
						Allow
					</Button>
					<Button variant="secondary" onClick={requestAccess.deny}>
						Deny
					</Button>
				</AlertBar>
			) : null}
		</>
	)
})
SystemStatusAlertBars.displayName = 'SystemStatusAlertBars'
