import React, { SyntheticEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { UILine } from 'src/model/UILine'
import { LineTypeIcon } from './LineTypeIcon'
import { TimeSpan } from '../TimeSpan/TimeSpan'
import { removeMarkdownish } from '@sofie-prompter-editor/shared-lib'

import classes from './Line.module.scss'
import ENPS from '../icons/ENPS'
import LetterWithPencil from '../icons/LetterWithPencil'
import { FocusTriangle } from '../icons/FocusTriangle'

const Line = observer(
	({
		segmentName,
		line,
		edited,
		output,
		onFocus,
		selected,
		onRecall,
	}: {
		segmentName: string | undefined
		line: UILine | undefined
		selected: boolean
		edited: boolean
		output: boolean
		onFocus?: React.FocusEventHandler<HTMLElement>
		onRecall?: React.EventHandler<SyntheticEvent>
	}): React.JSX.Element | null => {
		function onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
			if (e.key !== 'Enter') return

			onRecall?.(e)
		}

		function onDoubleClick(e: React.MouseEvent<HTMLElement>) {
			onRecall?.(e)
		}

		if (!line) return null

		return (
			<li
				className={[
					selected ? classes.LineSelected : classes.Line,
					line.isOnAir ? classes.LineIsOnAir : line.isNext ? classes.LineIsNext : null,
				]
					.filter(Boolean)
					.join(' ')}
				onFocus={onFocus}
				onKeyDown={onKeyDown}
				onDoubleClick={onDoubleClick}
				data-obj-id={line.id}
				tabIndex={0}
				role="treeitem"
			>
				<div className={classes.LineFlagNew}>{line.isNew ? <ENPS /> : null}</div>
				<div className={classes.LineFlagCaret}>{edited ? <LetterWithPencil /> : null}</div>
				<div className={classes.LineFlagOutput}>{output ? <FocusTriangle /> : null}</div>
				<div className={classes.LineSegmentName}>{segmentName}</div>
				<div className={classes.LineFlagOnAir}></div>
				<div className={classes.LineIdentifier}>{line.identifier}</div>
				<div className={classes.LineType}>
					<LineTypeIcon type={line.lineType?.style}>{line.lineType?.label}</LineTypeIcon>
				</div>
				<div className={classes.LineSlug}>{line.slug}</div>
				<div className={classes.LineScript}>
					{line.isEditable ? '' : 'READ ONLY '}
					{line.script ? removeMarkdownish(line.script) : null}
				</div>
				<div className={classes.ReadTime}>
					<TimeSpan>{line.readTime}</TimeSpan>
				</div>
				<div className={classes.LineDuration}>
					<TimeSpan>{line.expectedDuration}</TimeSpan>
				</div>
			</li>
		)
	}
)
Line.displayName = 'Line'

export { Line }
