import { observer } from 'mobx-react-lite'
import { UISegment } from 'src/model/UISegment'
import { Line } from './Line'

export const Segment = observer(function Segment({ segment }: { segment: UISegment }): React.ReactElement {
	return (
		<>
			<h2 data-obj-id={segment.id} data-anchor="segment">
				{segment.name}
			</h2>
			{segment.linesInOrder.map((line) => (
				<Line key={line.id} line={line} />
			))}
		</>
	)
})
Segment.displayName = 'Segment'
