import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { action } from 'mobx'
import { observer } from 'mobx-react-lite'
import { RootAppStore } from 'src/stores/RootAppStore'
import { Segment } from './Segment'
import { Button, ButtonGroup, ToggleButton } from 'react-bootstrap'
import classes from './CurrentRundown.module.scss'
import { useNavigate } from 'react-router-dom'
import { SystemStatusAlertBars } from 'src/components/SystemStatusAlertBars/SystemStatusAlertBars'
import { AnyTriggerAction } from 'src/lib/triggerActions/triggerActions'
import { getNextFocus } from '@bbc/tv-lrud-spatial'

const CurrentRundown = observer((): React.JSX.Element => {
	const [segmentLineListEl, setSegmentLineListEl] = useState<HTMLUListElement | null>(null)
	const [isListFocused, setIsListFocused] = useState(false)

	const openRundown = RootAppStore.rundownStore.openRundown
	const navigate = useNavigate()

	const onClose = action(() => {
		RootAppStore.rundownStore.closeRundown()
		navigate('/')
	})

	const onSendToOutput = action(() => {
		if (!openRundown) return

		RootAppStore.rundownStore.sendRundownToOutput(openRundown.id)
	})

	const onMovePrompterToHere = useCallback(() => {
		console.log('onMovePrompterToHere', isListFocused, RootAppStore.uiStore.selectedLineId)
		if (!isListFocused) return

		const objId = RootAppStore.uiStore.selectedLineId
		if (objId === null) return

		RootAppStore.control.jumpToObject(objId)
	}, [isListFocused])

	useLayoutEffect(() => {
		const el = segmentLineListEl
		if (!el) return

		function onFocusIn() {
			setIsListFocused(true)
		}

		function onFocusOut() {
			setIsListFocused(false)
		}

		el.addEventListener('focusin', onFocusIn)
		el.addEventListener('focusout', onFocusOut)

		return () => {
			el.removeEventListener('focusin', onFocusIn)
			el.removeEventListener('focusout', onFocusOut)
		}
	}, [segmentLineListEl])

	useEffect(() => {
		function onAction(action: AnyTriggerAction) {
			if (action.type === 'movePrompterToHere') onMovePrompterToHere()
		}

		RootAppStore.triggerStore.addListener('action', onAction)

		return () => {
			RootAppStore.triggerStore.removeListener('action', onAction)
		}
	}, [onMovePrompterToHere])

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLUListElement>) => {
			if (!segmentLineListEl) return
			const activeElement = document.activeElement
			if (!activeElement || !(activeElement instanceof HTMLElement)) return

			const nextFocus = getNextFocus(activeElement, e.key, segmentLineListEl)
			if (!nextFocus) return

			nextFocus.focus()
			e.preventDefault()
		},
		[segmentLineListEl]
	)

	const onShowOnlyLinesWithScriptToggle = () => {
		if (!openRundown) return
		const oldState = openRundown.filter ?? null

		if (oldState === null) {
			openRundown.setFilter('onlyScript')
			return
		}

		openRundown.setFilter(null)
	}

	if (!openRundown) {
		return <p>No open rundown</p>
	}

	return (
		<>
			<h1>{openRundown.name}</h1>
			<div>
				<Button variant="secondary" onClick={onClose}>
					Close
				</Button>
				<Button variant="primary" onClick={onSendToOutput}>
					Send to Output
				</Button>
				<ButtonGroup>
					<ToggleButton
						variant="secondary"
						type="checkbox"
						value={'1'}
						checked={!!openRundown.filter}
						id="rundown-filter-toggle-button"
						onChange={onShowOnlyLinesWithScriptToggle}
					>
						Show only Lines with script
					</ToggleButton>
				</ButtonGroup>
			</div>
			<SystemStatusAlertBars />
			<ul className={classes.SegmentLineList} role="tree" ref={setSegmentLineListEl} onKeyDown={onKeyDown}>
				{openRundown.segmentsInOrderFiltered.map((segment) => (
					<Segment segment={segment} key={segment.id} />
				))}
			</ul>
		</>
	)
})
CurrentRundown.displayName = 'CurrentRundown'

export { CurrentRundown }
