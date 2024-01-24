import { observer } from 'mobx-react-lite'
import { UILine } from 'src/model/UILine'

export const Line = observer(function Line({ line }: { line: UILine }): React.ReactElement {
	// TODO: line.script needs to be parsed, if it's markdownish and displayed across paragraphs
	return (
		<>
			<h3>{line.slug}</h3>
			{!line.script ? <p>&nbsp;</p> : null}
			{line.script?.split('\n').map((paragraph) => (
				<p key={paragraph}>{paragraph}</p>
			))}
		</>
	)
})
Line.displayName = 'Line'
