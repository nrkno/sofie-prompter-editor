import React from 'react'
import { APIConnection } from './api/ApiConnection.ts'

export const TestInterface: React.FC<{ api: APIConnection }> = ({ api }) => {
	return (
		<div>
			<button
				onClick={() => {
					console.log('Pinging...')
					api.example
						.pingGeneric(`I'm pinging you`)
						.then((reply) => {
							console.log(`Reply to ping: "${reply}"`)
						})
						.catch(console.error)
				}}
			>
				Ping Generic
			</button>

			<button
				onClick={() => {
					console.log('Pinging cats...')
					api.example
						.pingCategory('cats', `pinging cats`)
						.then((reply) => {
							console.log(`Reply to ping: "${reply}"`)
						})
						.catch(console.error)
				}}
			>
				Ping category "cats"
			</button>

			<button
				onClick={() => {
					console.log('subscribing to cats...')
					api.example
						.subscribeToPongCategory('cats')
						.then(() => {
							console.log(`subscribed`)
						})
						.catch(console.error)
				}}
			>
				Subscribe to "cats"
			</button>
			<button
				onClick={() => {
					console.log('unsubscribing to cats...')
					api.example
						.unsubscribeToPongCategory('cats')
						.then(() => {
							console.log(`unsubscribed`)
						})
						.catch(console.error)
				}}
			>
				Unsubscribe to "cats"
			</button>

			<button
				onClick={() => {
					console.log('subscribing to all playlists...')
					api.playlist
						.subscribeToPlaylists()
						.then(() => {
							console.log(`subscribed`)
						})
						.catch(console.error)
				}}
			>
				Subscribe tp playlists
			</button>
		</div>
	)
}
