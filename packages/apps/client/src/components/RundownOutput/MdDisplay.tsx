import { assertNever } from '@sofie-prompter-editor/shared-lib'
import React, { useMemo } from 'react'
import createParser from 'src/lib/mdParser'
import { Node, ParentNodeBase } from 'src/lib/mdParser/astNodes'

const mdParser = createParser()

export function MdDisplay({ source }: { source: string }): React.ReactNode {
	const rootNode = useMemo(() => mdParser(source), [source])

	return <MdNode content={rootNode} />
}

function MdNode({ content }: { content: Node }): React.ReactNode {
	switch (content.type) {
		case 'paragraph':
			return <p>{renderChildren(content)}</p>
		case 'root':
			return <>{renderChildren(content)}</>
		case 'emphasis':
			return <i>{renderChildren(content)}</i>
		case 'strong':
			return <b>{renderChildren(content)}</b>
		case 'reverse':
			return React.createElement('rev', {}, renderChildren(content))
		case 'text':
			return content.value
		default:
			assertNever(content)
			return null
	}
}

function renderChildren(content: ParentNodeBase): React.ReactNode {
	return (
		<>
			{content.children.map((node, index) => (
				<MdNode key={index + '_' + node.type} content={node} />
			))}
		</>
	)
}
