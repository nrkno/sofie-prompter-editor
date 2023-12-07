import { fromMarkdown as mdAstFromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown as mdAstToMarkdown } from 'mdast-util-to-markdown'
import type { Node as MdAstNode, Parent as MdAstParent, Literal as MdAstLiteral } from 'mdast'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import { directive } from 'micromark-extension-directive'
import { schema } from '../ScriptEditor/scriptSchema'
import { directiveFromMarkdown, directiveToMarkdown } from 'mdast-util-directive'
import { everyLineAParagraph } from './mdExtensions/everyLineAParagraph'

export function fromMarkdown(text: string): ProsemirrorNode[] {
	const ast = mdAstFromMarkdown(text, 'utf-8', {
		extensions: [directive()],
		mdastExtensions: [everyLineAParagraph(), directiveFromMarkdown()],
	})

	return traverseMdAstNodes(ast.children)
}

export function toMarkdown(_doc: ProsemirrorNode[]): string {
	return mdAstToMarkdown(
		{
			type: 'root',
			children: [],
		},
		{
			extensions: [directiveToMarkdown()],
		}
	)
}

function mdastToEditorSchemaNode(node: MdAstNode, children?: ProsemirrorNode[]): ProsemirrorNode[] {
	if (node.type === 'paragraph') {
		return [schema.node(schema.nodes.paragraph, undefined, children)]
	} else if (isLeafDirective(node) && node.name === 'emptyPara') {
		return [schema.node(schema.nodes.paragraph, undefined, [])]
	} else if (node.type === 'text' && isLiteral(node)) {
		return [schema.text(node.value)]
	} else if (node.type === 'strong' && children) {
		return children.map((child) => child.mark([...child.marks, schema.mark(schema.marks.bold)]))
	} else if (node.type === 'emphasis' && children) {
		return children.map((child) => child.mark([...child.marks, schema.mark(schema.marks.italic)]))
	} else if (isTextDirective(node) && node.name === 'reverse' && children) {
		return children.map((child) => child.mark([...child.marks, schema.mark(schema.marks.reverse)]))
	} else if (node.type === 'break') {
		return [schema.text('\n')]
	} else {
		console.warn(node)
		return [schema.text('[UNKNOWN]')]
	}
}

function traverseMdAstNodes(nodes: MdAstNode[]): ProsemirrorNode[] {
	const result: ProsemirrorNode[] = []
	for (const childNode of nodes) {
		let children: ProsemirrorNode[] = []
		if (isParent(childNode)) {
			children = traverseMdAstNodes(childNode.children)
		}
		result.push(...mdastToEditorSchemaNode(childNode, children))
	}

	return result
}

function isParent(node: MdAstNode): node is MdAstParent {
	if ('children' in node && Array.isArray(node.children)) return true
	return false
}

function isLiteral(node: MdAstNode): node is MdAstLiteral {
	if ('value' in node) return true
	return false
}

function isTextDirective(node: MdAstNode): node is MdAstTextDirective {
	if (node.type === 'textDirective' && 'name' in node) return true
	return false
}

function isLeafDirective(node: MdAstNode): node is MdAstTextDirective {
	if (node.type === 'leafDirective' && 'name' in node) return true
	return false
}

interface MdAstTextDirective extends MdAstNode {
	name: string
	attributes: Record<string, string>
}
