import React from 'react'
import { observer } from 'mobx-react-lite'
import { UISegment } from '../model/UISegment'
import { Line } from './Line'

const Segment = observer(({ segment }: { segment: UISegment | undefined }): React.JSX.Element | null => {
	if (!segment) return null

	return (
		<>
			<p>{segment.name}</p>
			<ul>
				{segment.linesInOrder.map((line) => (
					<li key={line.id}>
						<Line line={line} />
					</li>
				))}
			</ul>
		</>
	)
})
Segment.displayName = 'Segment'

export { Segment }
