/** Returns true */
export function isEmpty(obj: { [key: string]: any }): boolean {
	return obj && Object.keys(obj).length === 0
}
