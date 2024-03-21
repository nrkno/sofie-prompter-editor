import { DropdownDivider, DropdownItem, DropdownMenu } from 'react-bootstrap'

export function AppMenu() {
	return (
		<DropdownMenu>
			<DropdownItem>Open Rundown...</DropdownItem>
			<DropdownItem>Close Rundown</DropdownItem>
			<DropdownDivider />
			<DropdownItem>Connect Controller Device...</DropdownItem>
			<DropdownDivider />
			<DropdownItem>Preferences...</DropdownItem>
		</DropdownMenu>
	)
}
