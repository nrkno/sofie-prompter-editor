import { JSX } from 'react'
import { LineType } from '../model/UILine'
import classes from './LineTypeIcon.module.scss'

export function LineTypeIcon({ children, type }: { children?: string; type?: LineType }): JSX.Element | null {
	return <div className={getClassNameForType(type)}>{children}</div>
}

function getClassNameForType(type: LineType | undefined): string {
	switch (type) {
		case LineType.Camera:
			return classes.Camera
		case LineType.VT:
			return classes.VT
		case LineType.LiveSpeak:
			return classes.LiveSpeak
		case LineType.Remote:
			return classes.Remote
		case LineType.Split:
			return classes.Split
	}
	return ''
}
