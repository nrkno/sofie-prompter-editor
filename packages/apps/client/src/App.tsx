import React from 'react'
import { TestInterface } from './TestInterface.tsx'
import { APIConnection } from './api/ApiConnection.ts'

import './App.css'
import { RundownList } from './RundownList/RundownList.tsx'
import { CurrentRundown } from './CurrentRundown/CurrentRundown.tsx'
import { TestPlaylists } from './TestPlaylists.tsx'
function App(props: { api: APIConnection }): React.JSX.Element {
	return (
		<>
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
