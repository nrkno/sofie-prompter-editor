import { observer } from 'mobx-react-lite'
import React from 'react'
import { RootAppStore } from '../../stores/RootAppStore'
import { AlertBar } from '../AlertBar/AlertBar'

export const SystemStatusAlertBars = observer(function SystemStatusAlertBars(): React.JSX.Element {
	const isAPIConnected = RootAppStore.connected
	const isSofieConnected = RootAppStore.sofieConnected
	return (
		<>
			{!isAPIConnected ? <AlertBar variant="danger">Prompter is having network troubles</AlertBar> : null}
			{isSofieConnected ? <AlertBar variant="danger">Prompter is having network troubles</AlertBar> : null}
		</>
	)
})
SystemStatusAlertBars.displayName = 'SystemStatusAlertBars'
