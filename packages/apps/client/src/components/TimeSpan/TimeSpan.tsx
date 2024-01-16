import { formatTimeSpan } from './formatTimeSpan'

export function TimeSpan({ children }: { children?: number | undefined | null }): string {
	if (!children) return ''
	return formatTimeSpan(children)
}
