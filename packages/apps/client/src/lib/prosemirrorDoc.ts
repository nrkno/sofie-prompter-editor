import { Node as ProsemirrorNode } from 'prosemirror-model'
import { schema } from '../ScriptEditor/scriptSchema'
import { Node as MdAstNode } from './mdParser/astNodes'
import createMdParser from './mdParser'

export function fromMarkdown(text: string | null): ProsemirrorNode[] {
	if (text === null) return []

	const astFromMarkdownish = createMdParser()
	const ast = astFromMarkdownish(text)

	return traverseMdAstNodes(ast.children)
}

function mdastToEditorSchemaNode(node: MdAstNode, children?: ProsemirrorNode[]): ProsemirrorNode[] {
	if (node.type === 'paragraph') {
		return [schema.node(schema.nodes.paragraph, undefined, children)]
	} else if (node.type === 'text') {
		return [schema.text(node.value)]
	} else if (node.type === 'strong' && children) {
		return children.map((child) => child.mark([...child.marks, schema.mark(schema.marks.bold)]))
	} else if (node.type === 'emphasis' && children) {
		return children.map((child) => child.mark([...child.marks, schema.mark(schema.marks.italic)]))
	} else if (node.type === 'reverse' && children) {
		return children.map((child) => child.mark([...child.marks, schema.mark(schema.marks.reverse)]))
	} else {
		console.warn(node)
		return [schema.text('[UNKNOWN]')]
	}
}

function traverseMdAstNodes(nodes: MdAstNode[]): ProsemirrorNode[] {
	const result: ProsemirrorNode[] = []
	for (const childNode of nodes) {
		let children: ProsemirrorNode[] = []
		if ('children' in childNode) {
			children = traverseMdAstNodes(childNode.children)
		}
		result.push(...mdastToEditorSchemaNode(childNode, children))
	}

	return result
}
