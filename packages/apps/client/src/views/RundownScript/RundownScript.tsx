import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import classes from './RundownScript.module.scss'
import { CurrentRundown } from 'src/components/CurrentRundown/CurrentRundown'
import { Helmet } from 'react-helmet-async'
import { RundownPlaylistId, protectString } from '@sofie-prompter-editor/shared-model'
import { RootAppStore } from 'src/stores/RootAppStore'
import { useParams } from 'react-router-dom'
import { SplitPanel } from 'src/components/SplitPanel/SplitPanel'
import { EditorAndPreviewPanel } from './EditorAndPreviewPanel'

const RundownScript = observer((): React.JSX.Element => {
	const params = useParams()

	const playlistId = protectString<RundownPlaylistId>(params.playlistId)

	useEffect(() => {
		if (!playlistId) return

		RootAppStore.rundownStore.loadRundown(playlistId)
	}, [playlistId])

	function onChange(e: { value: number }) {
		RootAppStore.uiStore.setViewDividerPosition(e.value)
	}

	return (
		<>
			<Helmet>
				<title>Rundown</title>
				<body data-bs-theme="dark" />
			</Helmet>
			<SplitPanel
				position={RootAppStore.uiStore.viewDividerPosition}
				onChange={onChange}
				className={classes.RundownScript}
				childrenBegin={<CurrentRundown />}
				childrenEnd={<EditorAndPreviewPanel />}
				classNameEnd={classes.EditorAndPreviewPanel}
			/>
		</>
	)
})
RundownScript.displayName = 'RundownScript'

export default RundownScript
