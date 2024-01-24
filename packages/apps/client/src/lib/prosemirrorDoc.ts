import { Node as ProsemirrorNode } from 'prosemirror-model'
import { schema } from 'src/components/ScriptEditor/scriptSchema'
import { Node as MdAstNode, RootNode as MdRootNode } from './mdParser/astNodes'
import createMdParser from './mdParser'
import { assertNever } from '@sofie-prompter-editor/shared-lib'

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

export function toMarkdown(nodes: ProsemirrorNode[]): string {
	if (nodes.length === 0) return ''

	const mdAst: MdRootNode = {
		type: 'root',
		children: nodes.map(prosemirrorNodeToMarkdown),
	}

	return stringifyMarkdown(mdAst)
}

function stringifyMarkdown(mdAst: MdAstNode): string {
	if (mdAst.type === 'root') {
		return mdAst.children.map(stringifyMarkdown).join('')
	} else if (mdAst.type === 'paragraph') {
		return mdAst.children.map(stringifyMarkdown).join('') + '\n'
	} else if (mdAst.type === 'text') {
		return mdAst.value
	} else if (mdAst.type === 'emphasis' || mdAst.type === 'strong' || mdAst.type === 'reverse') {
		return `${mdAst.code}${mdAst.children.map(stringifyMarkdown).join('')}${mdAst.code}`
	} else {
		assertNever(mdAst)
		console.warn(mdAst)
		return '[UNKNOWN]'
	}
}

function prosemirrorNodeToMarkdown(node: ProsemirrorNode): MdAstNode {
	if (node.type === schema.nodes.paragraph) {
		const children: MdAstNode[] = []
		for (let i = 0; i < node.childCount; i++) {
			children.push(prosemirrorNodeToMarkdown(node.child(i)))
		}

		return {
			type: 'paragraph',
			children: children,
		}
	} else if (node.type === schema.nodes.text) {
		let textNode: MdAstNode = {
			type: 'text',
			value: node.text ?? '',
		}

		if (node.marks.find((mark) => mark.type === schema.marks.bold)) {
			textNode = {
				type: 'strong',
				children: [textNode],
				code: '**',
			}
		}
		if (node.marks.find((mark) => mark.type === schema.marks.italic)) {
			textNode = {
				type: 'emphasis',
				children: [textNode],
				code: '__',
			}
		}
		if (node.marks.find((mark) => mark.type === schema.marks.reverse)) {
			textNode = {
				type: 'reverse',
				children: [textNode],
				code: '~',
			}
		}

		return textNode
	} else {
		console.warn(node)
		return {
			type: 'text',
			value: '[UNKNOWN]',
		}
	}
}
