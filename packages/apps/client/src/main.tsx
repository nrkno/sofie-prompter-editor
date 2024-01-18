import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.scss'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { BackendPlayground } from './BackendPlayground/BackendPlayground.tsx'
import { ScriptEditor } from './ScriptEditor/ScriptEditor.tsx'
import { HelmetProvider } from 'react-helmet-async'
import { RundownList } from './RundownList/RundownList.tsx'

// Lazy-loading component imports (allow us to minimize bundle size)
// eslint-disable-next-line react-refresh/only-export-components
const RundownScript = React.lazy(() => import('./RundownScript/RundownScript.tsx'))
// eslint-disable-next-line react-refresh/only-export-components
const Output = React.lazy(() => import('./Output/Output.tsx'))
// eslint-disable-next-line react-refresh/only-export-components
const TestController = React.lazy(() => import('./TestController.tsx')) // TODO: temp

const router = createBrowserRouter([
	{
		path: '/rundown/:playlistId',
		element: <RundownScript />,
	},
	{
		path: '/output',
		element: <Output />,
	},
	{
		path: '/test-controller',
		element: <TestController />,
	},
	{
		path: '/',
		element: <App />,
		children: [
			{
				path: 'backend',
				element: <BackendPlayground />,
			},

			{
				path: 'editor',
				element: <ScriptEditor />,
			},
			{
				index: true,
				element: <RundownList />,
			},
		],
	},
])

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<HelmetProvider>
			<Suspense fallback={<>Loading...</>}>
				<RouterProvider router={router} />
			</Suspense>
		</HelmetProvider>
	</React.StrictMode>
)
