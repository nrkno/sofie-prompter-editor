import { observer } from 'mobx-react-lite'
import React from 'react'
import { RootAppStore } from 'src/stores/RootAppStore'
import { AlertBar } from 'src/components/AlertBar/AlertBar'
import { Button } from 'react-bootstrap'

export const SystemStatusAlertBars = observer(function SystemStatusAlertBars(): React.JSX.Element {
	const isAPIConnected = RootAppStore.connected
	const isSofieConnected = RootAppStore.sofieConnected

	const xKeysRequestsAccess = RootAppStore.triggerStore.xKeysRequestsAccess
	const streamdeckRequestsAccess = RootAppStore.triggerStore.streamdeckRequestsAccess
	const spacemouseRequestsAccess = RootAppStore.triggerStore.spacemouseRequestsAccess

	let requestAccess: {
		name: string
		allow: () => void
		deny: () => void
	} | null = null

	if (xKeysRequestsAccess) {
		requestAccess = {
			name: 'X-Keys panels',
			allow: () => RootAppStore.triggerStore.xkeysAccess(true),
			deny: () => RootAppStore.triggerStore.xkeysAccess(false),
		}
	} else if (streamdeckRequestsAccess) {
		requestAccess = {
			name: 'Streamdeck panels',
			allow: () => RootAppStore.triggerStore.streamdeckAccess(true),
			deny: () => RootAppStore.triggerStore.streamdeckAccess(false),
		}
	} else if (spacemouseRequestsAccess) {
		requestAccess = {
			name: 'SpaceMouse devices',
			allow: () => RootAppStore.triggerStore.spacemouseAccess(true),
			deny: () => RootAppStore.triggerStore.spacemouseAccess(false),
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
