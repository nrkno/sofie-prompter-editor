import React from 'react'
import { observer } from 'mobx-react-lite'
import { RootAppStore } from 'src/stores/RootAppStore'
import { UIRundownId } from 'src/model/UIRundown'
import { ListGroupItem } from 'react-bootstrap'
import { OpenRundownStore } from 'src/stores/OpenRundownStore'
import classes from './RundownEntry.module.scss'

export const RundownEntry = observer(
	({
		rundownId,
		onDoubleClick,
	}: {
		rundownId: UIRundownId
		onDoubleClick: React.MouseEventHandler<HTMLElement>
	}): React.JSX.Element => {
		const rundownEntry = RootAppStore.rundownStore.allRundowns.get(rundownId)

		const isSelected = OpenRundownStore.selectedRundownId === rundownId

		return (
			<ListGroupItem
				action
				onClick={() => OpenRundownStore.setSelectedRundownId(rundownId)}
				onDoubleClick={onDoubleClick}
				className={`${classes.RundownEntry} ${isSelected ? 'list-group-item-selected' : ''}`}
			>
				{rundownEntry?.name}
			</ListGroupItem>
		)
	}
)
RundownEntry.displayName = 'RundownEntry'
