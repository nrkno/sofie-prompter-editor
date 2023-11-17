import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.scss'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { MobXPlayground } from './MobXPlayground/MobXPlayground.tsx'
import { BackendPlayground } from './BackendPlayground/BackendPlayground.tsx'
import { ScriptEditor } from './ScriptEditor/ScriptEditor.tsx'
import { HelmetProvider } from 'react-helmet-async'

const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
		children: [
			{
				path: 'store',
				element: <MobXPlayground />,
			},
			{
				path: 'backend',
				element: <BackendPlayground />,
			},

			{
				path: 'editor',
				element: <ScriptEditor />,
			},
		],
	},
])

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<HelmetProvider>
			<RouterProvider router={router} />
		</HelmetProvider>
	</React.StrictMode>
)
