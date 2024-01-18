export function formatTimeSpan(timespan: number): string {
	const minutes = Math.floor(timespan / (60 * 1000))
	const seconds = Math.floor((timespan - minutes * 60 * 1000) / 1000)
	return `${String(minutes)}:${String(seconds).padStart(2, '0')}`
}
