import React from 'react'
import { observer } from 'mobx-react-lite'
import { UILine } from '../model/UILine'

const Line = observer(({ line }: { line: UILine | undefined }): React.JSX.Element | null => {
	if (!line) return null
	return <p>{line.slug}</p>
})
Line.displayName = 'Line'

export { Line }
