import { observer } from 'mobx-react-lite'
import { UILine } from 'src/model/UILine'
import { MdDisplay } from './MdDisplay'
import { TextDisplay } from './TextDisplay'

export const Line = observer(function Line({ line }: { line: UILine }): React.ReactElement {
	const script = line.script

	const isMdIsh = true

	return (
		<>
			<h3 data-obj-id={line.id} data-anchor="line">
				{line.slug}
			</h3>
			{!script ? <p>&nbsp;</p> : isMdIsh ? <MdDisplay source={script} /> : <TextDisplay source={script} />}
		</>
	)
})
Line.displayName = 'Line'
