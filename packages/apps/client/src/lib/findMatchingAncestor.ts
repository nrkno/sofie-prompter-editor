export function findMatchingAncestor(node: Node, selectors: string): HTMLElement | null {
	if (node instanceof HTMLElement) {
		if (node.matches(selectors)) return node
	}
	let parent = node.parentElement
	if (!parent) return null
	while (parent) {
		if (parent.matches(selectors)) return parent
		parent = parent.parentElement
	}
	return null
}
