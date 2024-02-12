declare module '@bbc/tv-lrud-spatial' {
	/**
	 * Get the next focus candidate
	 *
	 * @param elem The search origin (currently focused element)
	 * @param keyOrKeyCode The key or keyCode value (from KeyboardEvent) of the pressed key
	 * @param scope The element LRUD spatial is scoped to operate within
	 * @return The element that should receive focus next
	 */
	export function getNextFocus(
		elem: HTMLElement,
		keyOrKeyCode: string | number,
		scope?: HTMLElement
	): HTMLElement | null
}
