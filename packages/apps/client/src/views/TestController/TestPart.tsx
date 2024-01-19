import React from 'react'
import { APIConnection } from '../../api/ApiConnection.ts'
import { Part } from '@sofie-prompter-editor/shared-model'

export const TestPart: React.FC<{ api: APIConnection; part: Part }> = ({ part }) => {
	return (
		<div style={{ border: '1px solid yellow' }}>
			<h3>Part "{part.label}"</h3>
			<div>
				<table>
					<tbody>
						{Object.entries(part).map(([key, value]) => (
							<tr key={key}>
								<td>{key}</td>
								<td>{JSON.stringify(value)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
