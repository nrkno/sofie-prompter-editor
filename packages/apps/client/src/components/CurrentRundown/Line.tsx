import React from 'react'
import { observer } from 'mobx-react-lite'
import { UILine } from 'src/model/UILine'
import classes from './CurrentRundown.module.scss'
import { LineTypeIcon } from './LineTypeIcon'
import { TimeSpan } from '../TimeSpan/TimeSpan'
import { removeMarkdownish } from 'src/lib/removeMarkdownish'

const Line = observer(
	({
		line,
		onFocus,
		selected,
	}: {
		line: UILine | undefined
		selected: boolean
		onFocus: React.FocusEventHandler<HTMLElement>
	}): React.JSX.Element | null => {
		if (!line) return null
		return (
			<li
				className={selected ? classes.LineSelected : classes.Line}
				onFocus={onFocus}
				data-obj-id={line.id}
				tabIndex={0}
				role="treeitem"
			>
				<div className={classes.LineIdentifier}>{line.identifier}</div>
				<div className={classes.LineType}>
					<LineTypeIcon type={line.lineType?.style}>{line.lineType?.label}</LineTypeIcon>
				</div>
				<div className={classes.LineSlug}>{line.slug}</div>
				<div className={classes.LineScript}>{line.script ? removeMarkdownish(line.script) : null}</div>
				<div className={classes.LineDuration}>
					<TimeSpan>{line.expectedDuration}</TimeSpan>
				</div>
				<div className={classes.ReadTime}>
					<TimeSpan>{line.readTime}</TimeSpan>
				</div>
			</li>
		)
	}
)
Line.displayName = 'Line'

export { Line }
