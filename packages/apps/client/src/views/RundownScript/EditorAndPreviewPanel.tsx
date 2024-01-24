import React from 'react'

import classes from './EditorAndPreviewPanel.module.scss'
import { ScriptEditor } from 'src/components/ScriptEditor/ScriptEditor'
import { PreviewPanel } from './PreviewPanel'

export function EditorAndPreviewPanel(): React.ReactNode {
	return (
		<div className={classes.EditorAndPreviewPanel}>
			<div className={classes.PreviewArea}>
				<PreviewPanel />
			</div>
			<div className={classes.EditorArea}>
				<ScriptEditor />
			</div>
		</div>
	)
}
