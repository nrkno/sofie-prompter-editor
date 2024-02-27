import { Node } from 'prosemirror-model'
import { schema } from './scriptSchema'

export function nearestElement(node: globalThis.Node | null): HTMLElement | null {
	return node?.parentElement ?? null
}

export function findNode(
	node: Node,
	predicate: (needle: Node, offset: number, index: number) => boolean
): undefined | NodeWithPosition {
	let found: NodeWithPosition | undefined = undefined
	node.descendants((maybeNode, pos, _, index) => {
		if (found) return
		const isOK = predicate(maybeNode, pos, index)
		if (isOK) found = { node: maybeNode, pos }
	})

	return found
}

export function getNodeRange(line: NodeWithPosition) {
	const ranges: { offset: number; size: number }[] = []

	line.node.forEach((node, offset) => {
		if (node.type !== schema.nodes.paragraph) return
		ranges.push({ offset, size: node.nodeSize })
	})
	ranges.sort((a, b) => a.offset - b.offset)

	let beginOffset: number = line.node.nodeSize - 1
	let endOffset: number = beginOffset

	if (ranges.length !== 0) {
		beginOffset = line.pos + 1 + ranges[0].offset
		endOffset = line.pos + 1 + ranges[ranges.length - 1].offset + ranges[ranges.length - 1].size
	}

	return {
		beginOffset,
		endOffset,
	}
}

type NodeWithPosition = {
	node: Node
	pos: number
}
