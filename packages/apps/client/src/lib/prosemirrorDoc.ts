import { fromMarkdown as mdastFromMarkdown } from 'mdast-util-from-markdown'
import type { Node, Parent } from 'mdast'
import { directive } from 'micromark-extension-directive'
import { directiveFromMarkdown } from 'mdast-util-directive'

export function fromMarkdown(text: string): void {
	const ast = mdastFromMarkdown(text, 'utf-8', {
		extensions: [directive()],
		mdastExtensions: [directiveFromMarkdown()],
	})

	traverseNodes(ast.children)
}

function traverseNodes(nodes: Node[]) {
	for (const childNode of nodes) {
		console.dir(childNode)
		if (isParent(childNode)) traverseNodes(childNode.children)
	}
}

function isParent(node: Node): node is Parent {
	if ('children' in node && Array.isArray(node.children)) return true
	return false
}
