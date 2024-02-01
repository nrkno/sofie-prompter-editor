export function TextDisplay({ source }: { source: string }): React.ReactNode {
	return source.split('\n').map((paragraph, i) => <p key={paragraph + '_' + i}>{paragraph || '\xa0'}</p>)
}
