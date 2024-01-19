import React from 'react'
import { APIConnection } from '../../api/ApiConnection.ts'
import { Rundown, Segment, SegmentId } from '@sofie-prompter-editor/shared-model'
import { useApiConnection } from './TestUtil.tsx'
import { TestSegment } from './TestSegment.tsx'

export const TestRundown: React.FC<{ api: APIConnection; rundown: Rundown }> = ({ api, rundown }) => {
	const [segments, setSegments] = React.useState<Record<SegmentId, Segment>>({})

	const updateSegments = React.useCallback((id: SegmentId, data: (prev: Segment | undefined) => Segment | null) => {
		setSegments((prev) => {
			const newData = data(prev[id])
			if (newData === null) {
				const d = { ...prev }
				delete d[id]
				return d
			} else {
				return {
					...prev,
					[id]: newData,
				}
			}
		})
	}, [])

	useApiConnection(
		(connected) => {
			if (!connected) return

			api.segment.on('created', (data) => {
				if (data.rundownId !== rundown._id) return
				updateSegments(data._id, () => data)
			})
			api.segment.on('updated', (data) => {
				if (data.rundownId !== rundown._id) return
				updateSegments(data._id, () => data)
			})
			api.segment.on('removed', (data) => {
				if (data.rundownId !== rundown._id) return
				updateSegments(data._id, () => null)
			})

			// Also fetch initial list:
			api.segment
				.find({
					query: {
						rundownId: rundown._id,
					},
				})
				.then((list) => {
					const mySegments = list.filter((segment) => segment.rundownId === rundown._id)

					console.log('list segments', mySegments)
					mySegments.forEach((segment) => updateSegments(segment._id, () => segment))
				})
				.catch(console.error)
		},
		api,
		[rundown._id]
	)

	const sortedSegments = React.useMemo(() => {
		return Object.values<Segment>(segments).sort((a, b) => a.rank - b.rank)
	}, [segments])

	return (
		<div style={{ border: '1px solid red' }}>
			<h3>Rundown "{rundown.label}"</h3>
			<div>
				<b>Segments:</b>
				<div style={{ margin: '0.5em' }}>
					{sortedSegments.map((segment) => (
						<TestSegment key={segment._id} api={api} segment={segment}></TestSegment>
					))}
				</div>
			</div>
		</div>
	)
}
