import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import classes from './RundownScript.module.scss'
import { CurrentRundown } from '../CurrentRundown/CurrentRundown'
import { ScriptEditor } from '../ScriptEditor/ScriptEditor'
import { Helmet } from 'react-helmet-async'
import { RundownPlaylistId, protectString } from '@sofie-prompter-editor/shared-model'
import { AppStore } from '../stores/AppStore'
import { useParams } from 'react-router-dom'
import { SplitPanel } from '../components/SplitPanel/SplitPanel'

export const RundownScript = observer((): React.JSX.Element => {
	const params = useParams()

	const playlistId = protectString<RundownPlaylistId>(params.playlistId)

	useEffect(() => {
		if (!playlistId) return

		AppStore.rundownStore.loadRundown(playlistId)
	}, [playlistId])

	return (
		<>
			<Helmet>
				<title>Rundown</title>
				<body data-bs-theme="dark" />
			</Helmet>
			<SplitPanel
				position={AppStore.uiStore.viewDividerPosition}
				onChange={(e) => AppStore.uiStore.setViewDividerPosition(e.value)}
				className={classes.RundownScript}
				childrenBegin={<CurrentRundown />}
				childrenEnd={<ScriptEditor />}
			/>
		</>
	)
})
RundownScript.displayName = 'RundownScript'
