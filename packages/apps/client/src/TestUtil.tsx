import React, { useEffect } from 'react'
import { APIConnection } from './api/ApiConnection.ts'

export function useApiConnection(
	effect: (connected: boolean) => void,
	api: APIConnection,
	deps?: React.DependencyList | undefined
): void {
	const [connected, setConnected] = React.useState(api.connected)

	useEffect(() => {
		const onConnected = () => {
			setConnected(true)
		}
		const onDisconnected = () => {
			setConnected(false)
		}
		api.on('connected', onConnected)
		api.on('disconnected', onDisconnected)
		return () => {
			api.off('connected', onConnected)
			api.off('disconnected', onDisconnected)
		}
	}, [])

	useEffect(() => {
		effect(connected)
	}, [connected, ...(deps || [])])
}
