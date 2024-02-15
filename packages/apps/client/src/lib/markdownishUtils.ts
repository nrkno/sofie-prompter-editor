export function removeMarkdownish(text: string): string {
	return text.replaceAll(MARKDOWNISH_FILTER, '')
}

export function convertPlainTextScriptToMarkdown(script: string): string {
	// first, escape all markdownish control codes, then mark square-bracket text with Reverse formating
	return script.replaceAll(MARKDOWNISH_CONTROL_CODES, '\\$1').replaceAll(SQUARE_BRACKETS_REVERSE, '~[$1]~')
}

const SQUARE_BRACKETS_REVERSE = /\[([^\]]+)\]/g
const MARKDOWNISH_CONTROL_CODES = /([\\*_~])/g
const MARKDOWNISH_FILTER = /(?<!\\)[\\*_~]/gi
