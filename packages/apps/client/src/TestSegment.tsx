import React from 'react'
import { APIConnection } from './api/ApiConnection.ts'
import { Segment, Part, PartId } from '@sofie-prompter-editor/shared-model'
import { useApiConnection } from './TestUtil.tsx'
import { TestPart } from './TestPart.tsx'

export const TestSegment: React.FC<{ api: APIConnection; segment: Segment }> = ({ api, segment }) => {
	const [parts, setParts] = React.useState<Record<PartId, Part>>({})

	const updateParts = React.useCallback((id: PartId, data: (prev: Part | undefined) => Part | null) => {
		setParts((prev) => {
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

			api.part.on('created', (data) => {
				if (data.segmentId !== segment._id) return
				updateParts(data._id, () => data)
			})
			api.part.on('updated', (data) => {
				if (data.segmentId !== segment._id) return
				updateParts(data._id, () => data)
			})
			api.part.on('removed', (data) => {
				if (data.segmentId !== segment._id) return
				updateParts(data._id, () => null)
			})

			// Also fetch initial list:
			api.part
				.find({
					query: {
						segmentId: segment._id,
					},
				})
				.then((list) => {
					const myParts = list.filter((part) => part.segmentId === segment._id)
					console.log('list part', myParts)
					myParts.forEach((part) => updateParts(part._id, () => part))
				})
				.catch(console.error)
		},
		api,
		[segment._id]
	)

	const sortedParts = React.useMemo(() => {
		return Object.values<Part>(parts).sort((a, b) => a.rank - b.rank)
	}, [parts])

	return (
		<div style={{ border: '1px solid blue' }}>
			<h3>Segment "{segment.label}"</h3>
			<div>
				<b>Parts:</b>
				<div style={{ margin: '0.5em' }}>
					{sortedParts.map((part) => (
						<TestPart key={part._id} api={api} part={part}></TestPart>
					))}
				</div>
			</div>
		</div>
	)
}
