import { ParentNodeBase, RootNode, Node } from './astNodes'
import { emphasisAndStrong } from './constructs/emphasisAndStrong'
import { escape } from './constructs/escape'
import { paragraph } from './constructs/paragraph'
import { reverse } from './constructs/reverse'

export interface ParserState {
	readonly nodeStack: ParentNodeBase[]
	nodeCursor: ParentNodeBase | null
	buffer: string
	charCursor: number
	readonly dataStore: Record<string, unknown>
	flushBuffer: () => void
	pushNode: (node: ParentNodeBase) => void
	popNode: () => void
	replaceStack: (node: ParentNodeBase) => void
	peek: () => string | undefined
	consume: () => void
}

export class ParserStateImpl implements ParserState {
	readonly nodeStack: ParentNodeBase[] = []
	nodeCursor: ParentNodeBase | null = null
	buffer: string = ''
	charCursor: number = 0
	readonly dataStore: Record<string, unknown> = {}

	constructor(private document: RootNode, private text: string) {}

	flushBuffer = () => {
		if (this.buffer === '') return
		if (this.nodeCursor === null) throw new Error('No node available to flush buffer.')

		this.nodeCursor.children.push({
			type: 'text',
			value: this.buffer,
		})
		this.buffer = ''
	}
	pushNode = (node: ParentNodeBase) => {
		if (this.nodeCursor === null) {
			this.nodeCursor = node
		} else {
			this.nodeCursor.children.push(node as Node)
		}
		this.nodeStack.push(node)
		this.nodeCursor = node
	}
	popNode = () => {
		this.nodeStack.pop()
		this.nodeCursor = this.nodeStack[this.nodeStack.length - 1]
	}
	replaceStack = (node: ParentNodeBase) => {
		this.document.children.push(node as Node)
		this.nodeCursor = node
		this.nodeStack.length = 0
		this.nodeStack.push(this.nodeCursor)
	}
	peek = () => {
		return this.text[this.charCursor + 1]
	}
	consume = () => {
		this.charCursor++
	}
}

export type CharHandler = (char: string, state: ParserState) => void | undefined | boolean

export interface NodeConstruct {
	name?: string
	char: Record<string, CharHandler>
}

export function astFromMarkdownish(text: string): RootNode {
	performance.mark('astFromMarkdownishBegin')

	const document: RootNode = {
		type: 'root',
		children: [],
	}

	const state = new ParserStateImpl(document, text)

	const nodeConstructs: NodeConstruct[] = [paragraph(), escape(), emphasisAndStrong(), reverse()]

	const charHandlers: Record<string, CharHandler[]> = {}

	for (const construct of nodeConstructs) {
		for (const [char, handler] of Object.entries(construct.char)) {
			if (!charHandlers[char]) charHandlers[char] = []
			charHandlers[char].push(handler)
		}
	}

	function runAll(handlers: CharHandler[], char: string, state: ParserState): void | undefined | boolean {
		for (const handler of handlers) {
			const result = handler(char, state)
			if (typeof result === 'boolean') return result
		}
	}

	for (state.charCursor = 0; state.charCursor < text.length; state.charCursor++) {
		const char = text[state.charCursor]
		let preventOthers = false
		if (!preventOthers && charHandlers['any']) {
			const result = runAll(charHandlers['any'], char, state)
			if (result === false) continue
			if (result === true) preventOthers = true
		}
		if (!preventOthers && charHandlers[char]) {
			const result = runAll(charHandlers[char], char, state)
			if (result === false) continue
			if (result === true) preventOthers = true
		}
		state.buffer += char
	}

	if (charHandlers['end']) runAll(charHandlers['end'], 'end', state)

	performance.mark('astFromMarkdownishEnd')

	console.log(performance.measure('astFromMarkdownish', 'astFromMarkdownishBegin', 'astFromMarkdownishEnd'))

	console.log(document)

	return document
}
