import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from 'src/App.tsx'
import 'src/index.scss'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { RundownList } from 'src/views/RundownList/RundownList.tsx'

// Lazy-loading component imports (allow us to minimize bundle size)
// eslint-disable-next-line react-refresh/only-export-components
const RundownScript = React.lazy(() => import('./views/RundownScript/RundownScript.tsx'))
// eslint-disable-next-line react-refresh/only-export-components
const Output = React.lazy(() => import('./views/Output/Output.tsx'))
// eslint-disable-next-line react-refresh/only-export-components
const TestController = React.lazy(() => import('./views/TestController/TestController.tsx')) // TODO: temp

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
