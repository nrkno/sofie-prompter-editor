import React, { useContext } from 'react'
import { TestInterface } from '../TestInterface'
import { TestPlaylists } from '../TestPlaylists'
import { APIConnectionContext } from '../api/ApiConnectionContext'

export function BackendPlayground(): React.JSX.Element {
	const api = useContext(APIConnectionContext)

	return (
		<>
			<div>
				<TestInterface api={api} />
			</div>
			<div>
				<TestPlaylists api={api} />
			</div>
		</>
	)
}
