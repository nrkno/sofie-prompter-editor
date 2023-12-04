import { CurrentRundown } from '../CurrentRundown/CurrentRundown'
import { RundownList } from '../RundownList/RundownList'

export function MobXPlayground(): React.JSX.Element {
	return (
		<>
			<div>
				<RundownList />
			</div>
			<div>
				<CurrentRundown />
			</div>
		</>
	)
}
