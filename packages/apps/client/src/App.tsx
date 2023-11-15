import React, { useEffect } from 'react'
import { TestInterface } from './TestInterface.tsx'
import { APIConnection } from './api/ApiConnection.ts'

import './App.css'
import { RundownList } from './RundownList/RundownList.tsx'
import { CurrentRundown } from './CurrentRundown/CurrentRundown.tsx'
import { TestPlaylists } from './TestPlaylists.tsx'
import { Helmet } from 'react-helmet'
function App(props: { api: APIConnection }): React.JSX.Element {
	useEffect(() => {
		window.document.body.dataset['bsTheme'] = 'dark'
	}, [])

	return (
		<>
			<Helmet>
				<title>App</title>
			</Helmet>
			<div>
				<RundownList />
			</div>
			<div>
				<CurrentRundown />
			</div>
			<div>
				<TestInterface api={props.api} />
			</div>
			<div>
				<TestPlaylists api={props.api} />
			</div>
		</>
	)
}

export default App
