export function removeMarkdownish(text: string): string {
	return text.replaceAll(MARKDOWNISH_FILTER, '')
}

const MARKDOWNISH_FILTER = /(?<!\\)[~*_\\]/gi
