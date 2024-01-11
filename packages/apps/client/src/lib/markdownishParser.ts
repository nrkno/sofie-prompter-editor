interface NodeBase {
	type: string
}

interface ParentNodeBase extends NodeBase {
	children: Node[]
}

interface RootNode extends ParentNodeBase {
	type: 'root'
}

interface ParagraphNode extends ParentNodeBase {
	type: 'paragraph'
}

interface TextNode extends NodeBase {
	type: 'text'
	value: string
}

interface StrongNode extends ParentNodeBase {
	type: 'strong'
	code: string
}

interface EmphasisNode extends ParentNodeBase {
	type: 'emphasis'
	code: string
}

interface ReverseNode extends ParentNodeBase {
	type: 'reverse'
	code: string
}

export type Node = RootNode | ParagraphNode | TextNode | StrongNode | EmphasisNode | ReverseNode

export function astFromMarkdownish(text: string): RootNode {
	const document: RootNode = {
		type: 'root',
		children: [],
	}
	const stack: ParentNodeBase[] = []
	let cursor: ParentNodeBase | null = null
	let buffer = ''

	let i = 0

	function flushBuffer() {
		if (buffer === '') return
		if (cursor === null) throw new Error('cursor === null assertion')

		cursor.children.push({
			type: 'text',
			value: buffer,
		})
		buffer = ''
	}

	function paragraphStart() {
		const newParagraph: ParagraphNode = {
			type: 'paragraph',
			children: [],
		}
		document.children.push(newParagraph)
		cursor = newParagraph
		stack.length = 0
		stack.push(cursor)
	}

	function paragraphEnd() {
		if (buffer === '') return
		if (cursor === null) throw new Error('cursor === null assertion')

		flushBuffer()
		cursor = null
	}

	function peek() {
		return text[i + 1]
	}

	function emphasisOrStrong(char: string) {
		if (cursor === null) throw new Error('cursor === null assertion')
		if ((cursor.type === 'emphasis' || cursor.type === 'strong') && 'code' in cursor) {
			if (cursor.code === char) {
				if (peek() === char) {
					i++
				}

				flushBuffer()
				stack.pop()
				cursor = stack[stack.length - 1]
				return
			}
		}

		flushBuffer()

		let type: 'emphasis' | 'strong' = 'emphasis'

		if (peek() === char) {
			type = 'strong'
			i++
		}

		const emphasisOrStrong: EmphasisNode | StrongNode = {
			type,
			children: [],
			code: char,
		}
		cursor.children.push(emphasisOrStrong)
		stack.push(emphasisOrStrong)
		cursor = emphasisOrStrong
	}

	if (text.length > 0) {
		paragraphStart()
	}

	for (i = 0; i < text.length; i++) {
		const char = text[i]
		switch (char) {
			case '\n':
				paragraphEnd()
				continue
			case '*':
			case '_':
				emphasisOrStrong(char)
				continue
		}
		if (cursor === null) paragraphStart()
		buffer += char
	}

	paragraphEnd()

	console.log(document)

	return document
}
