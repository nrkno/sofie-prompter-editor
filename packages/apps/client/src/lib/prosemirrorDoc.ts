import { Node as ProsemirrorNode } from 'prosemirror-model'
import { schema } from 'src/components/ScriptEditor/scriptSchema'
import { Node as MdAstNode, RootNode as MdRootNode } from './mdParser/astNodes'
import createMdParser from './mdParser'
import { assertNever } from '@sofie-prompter-editor/shared-lib'

export function fromMarkdown(text: string | null): ProsemirrorNode[] {
	if (text === null) return []

	const astFromMarkdownish = createMdParser()
	const ast = astFromMarkdownish(text)

	// console.log(ast)

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
	} else if (node.type === 'underline' && children) {
		return children.map((child) => child.mark([...child.marks, schema.mark(schema.marks.underline)]))
	} else if (node.type === 'hidden' && children) {
		return children.map((child) => child.mark([...child.marks, schema.mark(schema.marks.hidden)]))
	} else if (node.type === 'colour' && children) {
		return children.map((child) =>
			child.mark([...child.marks, schema.mark(schema.marks.colour, { colour: node.colour })])
		)
	} else if (node.type === 'screenMarker') {
		return [schema.node(schema.nodes.backScreenMarker)]
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

function escapeText(text: string): string {
	return text.replace(/([_*~\\])/gi, '\\$1')
}

function stringifyMarkdown(mdAst: MdAstNode): string {
	if (mdAst.type === 'root') {
		return mdAst.children.map(stringifyMarkdown).join('\n')
	} else if (mdAst.type === 'paragraph') {
		return mdAst.children.map(stringifyMarkdown).join('')
	} else if (mdAst.type === 'text') {
		return escapeText(mdAst.value)
	} else if (
		mdAst.type === 'emphasis' ||
		mdAst.type === 'strong' ||
		mdAst.type === 'reverse' ||
		mdAst.type === 'underline' ||
		mdAst.type === 'hidden'
	) {
		return `${mdAst.code}${mdAst.children.map(stringifyMarkdown).join('')}${mdAst.code}`
	} else if (mdAst.type === 'colour') {
		const colours = {
			red: '#ff0000',
			yellow: '#ffff00',
		}
		return `[colour=${colours[mdAst.colour] ?? colours['red']}]${mdAst.children
			.map(stringifyMarkdown)
			.join('')}[/colour]`
	} else if (mdAst.type === 'screenMarker') {
		return '(X)'
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

		if (node.marks.find((mark) => mark.type === schema.marks.hidden)) {
			textNode = {
				type: 'hidden',
				children: [textNode],
				code: '$',
			}
		}
		if (node.marks.find((mark) => mark.type === schema.marks.underline)) {
			textNode = {
				type: 'underline',
				children: [textNode],
				code: '||',
			}
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
				code: '_',
			}
		}
		if (node.marks.find((mark) => mark.type === schema.marks.reverse)) {
			textNode = {
				type: 'reverse',
				children: [textNode],
				code: '~',
			}
		}
		const colourMark = node.marks.find((mark) => mark.type === schema.marks.colour)
		if (colourMark) {
			textNode = {
				type: 'colour',
				children: [textNode],
				code: '', // eh?
				colour: colourMark.attrs.colour ?? 'red',
			}
		}

		return textNode
	} else if (node.type === schema.nodes.backScreenMarker) {
		return {
			type: 'screenMarker',
		}
	} else {
		console.warn(node)
		return {
			type: 'text',
			value: '[UNKNOWN]',
		}
	}
}
