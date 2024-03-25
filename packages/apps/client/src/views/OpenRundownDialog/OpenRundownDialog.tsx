import React from 'react'
import { observer } from 'mobx-react-lite'
import classes from './OpenRundownDialog.module.scss'
import { Button, ListGroup, Modal } from 'react-bootstrap'
import { RootAppStore } from 'src/stores/RootAppStore'
import { keys } from 'mobx'
import { UIRundownId } from 'src/model/UIRundown'
import { RundownEntry } from './RundownEntry'
import { OpenRundownStore } from 'src/stores/OpenRundownStore'
import { useNavigate } from 'react-router-dom'

export const OpenRundownDialog = observer(function OpenRundownDialog(): React.ReactNode {
	const navigate = useNavigate()
	const someNeedsToBeSelected = !RootAppStore.rundownStore.openRundown
	const someIsSelected = OpenRundownStore.selectedRundownId !== null

	function handleClose() {
		if (someNeedsToBeSelected && !someIsSelected) return
		RootAppStore.uiStore.requestCloseRundownOpenDialog()
		OpenRundownStore.setSelectedRundownId(null)
	}

	function handleConfirm() {
		const rundownId = OpenRundownStore.selectedRundownId
		if (rundownId === null) return
		RootAppStore.uiStore.requestCloseRundownOpenDialog()
		RootAppStore.rundownStore.loadRundown(rundownId)
		OpenRundownStore.setSelectedRundownId(null)
		navigate(`/rundown/${rundownId}`)
	}

	const isOpen = RootAppStore.uiStore.isRundownOpenDialogOpen

	const allRundownIds = keys<UIRundownId>(RootAppStore.rundownStore.allRundowns)

	return (
		<Modal show={isOpen} onHide={handleClose} className={classes.OpenRundown}>
			<Modal.Header closeButton={!someNeedsToBeSelected}>
				<Modal.Title>Open Rundown</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<ListGroup>
					{allRundownIds.map((rundownId) => (
						<RundownEntry rundownId={rundownId} key={rundownId} onDoubleClick={handleConfirm} />
					))}
				</ListGroup>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={handleClose} disabled={someNeedsToBeSelected}>
					Cancel
				</Button>
				<Button variant="primary" onClick={handleConfirm} disabled={!someIsSelected}>
					Open
				</Button>
			</Modal.Footer>
		</Modal>
	)
})
OpenRundownDialog.displayName = 'OpenRundown'
