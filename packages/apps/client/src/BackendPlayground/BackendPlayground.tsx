import React, { useContext } from 'react'
import { TestInterface } from '../TestInterface'
import { TestPlaylists } from '../TestPlaylists'
import { APIConnectionContext } from '../api/ApiConnectionContext'
import { TestController } from '../TestController.tsx'
import { TestViewPort } from '../TestViewPort.tsx'

export function BackendPlayground(): React.JSX.Element {
	const api = useContext(APIConnectionContext)

	return (
		<>
			<div>
				<TestInterface api={api} />
			</div>
			<div>
				<TestController api={api} />
			</div>
			<div>
				<TestViewPort api={api} />
			</div>
			<div>
				<TestPlaylists api={api} />
			</div>
		</>
	)
}
