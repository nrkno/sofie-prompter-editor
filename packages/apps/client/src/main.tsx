import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { APIConnection } from './api/ApiConnection.ts'

const app = new APIConnection()
app.on('connected', () => console.log('connected'))
app.on('disconnected', () => console.log('disconnected'))

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
)
