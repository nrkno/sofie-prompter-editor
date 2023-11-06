import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { APIConnection } from './api/ApiConnection.ts'
import { assertType } from '@sofie-prompter-editor/shared-lib'

const api = new APIConnection()
api.on('connected', () => console.log('connected'))
api.on('disconnected', () => console.log('disconnected'))

api.playlist.on('tmpPong', (payload) => {
	assertType<string>(payload)
	console.log(`Got a tmpPong message: "${payload}"`)
})
api.example.on('pongGeneric', (payload) => {
	assertType<string>(payload)
	console.log(`Got a pongGeneric message: "${payload}"`)
})
api.example.on('pongCategory', (message) => {
	console.log(`Got a pongCategory "${message.category}" message: "${message.payload}"`)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<App api={api} />
	</React.StrictMode>
)
