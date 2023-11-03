/** Make a string out of an error, including any additional data such as stack trace if available */
export function stringifyError(error: unknown, noStack = false): string {
	let str = `${error}`

	if (error && typeof error === 'object' && (error as any).reason) {
		str = `${(error as any).reason}`
	}
	if (error && typeof error === 'object' && (error as any).context) {
		str += `, Context: ${(error as any).context}`
	}

	if (!noStack) {
		if (error && typeof error === 'object' && (error as any).stack) {
			str += ', ' + (error as any).stack
		}
	}

	if (str === '[object Object]') {
		// A last try to make something useful:
		try {
			str = JSON.stringify(error)
			if (str.length > 200) {
				str = str.slice(0, 200) + '...'
			}
		} catch (e) {
			str = '[Error in stringifyError: Failed to stringify]'
		}
	}
	return str
}
