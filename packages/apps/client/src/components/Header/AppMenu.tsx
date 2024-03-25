import { DropdownDivider, DropdownItem, DropdownMenu } from 'react-bootstrap'
import { RootAppStore } from 'src/stores/RootAppStore'

export function AppMenu() {
	function onOpenRundown() {
		RootAppStore.uiStore.openRundownOpenDialog()
	}

	return (
		<DropdownMenu>
			<DropdownItem onClick={onOpenRundown}>Open Rundown...</DropdownItem>
			<DropdownItem>Close Rundown</DropdownItem>
			<DropdownDivider />
			<DropdownItem>Connect Controller Device...</DropdownItem>
			<DropdownDivider />
			<DropdownItem>Preferences...</DropdownItem>
		</DropdownMenu>
	)
}
