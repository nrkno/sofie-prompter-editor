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
	}, [api])

	useEffect(() => {
		effect(connected)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [connected, ...(deps || [])])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EditObject: React.FC<{ obj: any; onChange: (value: any) => void }> = ({ obj, onChange }) => {
	const updateProperty = React.useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(key: string, value: any) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const newViewPort: any = {
				...obj,
			}
			newViewPort[key] = value
			onChange(newViewPort)
		},
		[obj, onChange]
	)

	return (
		<table>
			<tbody>
				{
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					Object.entries<any>(obj).map(([key, value]) => (
						<tr key={key}>
							<td style={{ textAlign: 'right' }}>{key}:</td>
							<td>
								<EditValue
									value={value}
									onChange={(value) => {
										updateProperty(key, value)
									}}
								/>
							</td>
						</tr>
					))
				}
			</tbody>
		</table>
	)
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EditValue: React.FC<{ value: any; onChange: (value: any) => void }> = ({ value, onChange }) => {
	const valueType = typeof value
	return valueType === 'string' ? (
		<input
			type="text"
			value={value}
			onChange={(e) => {
				onChange(e.target.value)
			}}
		/>
	) : valueType === 'number' ? (
		<input
			type="number"
			value={value}
			onChange={(e) => {
				onChange(Number.parseFloat(e.target.value))
			}}
		/>
	) : valueType === 'boolean' ? (
		<input
			type="checkbox"
			checked={value}
			onChange={(e) => {
				onChange(e.target.checked)
			}}
		/>
	) : valueType === 'object' ? (
		value === null ? null : (
			<EditObject
				obj={value}
				onChange={(newValue) => {
					onChange(newValue)
				}}
			/>
		)
	) : (
		JSON.stringify(value)
	)
}
