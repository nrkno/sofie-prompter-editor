import React from 'react'
import classes from './HamburgerMenu.module.scss'
import Hamburger from '../icons/Hamburger'
import { Dropdown } from 'react-bootstrap'

export function HamburgerMenu({ children }: React.PropsWithChildren) {
	return (
		<Dropdown className={classes.HamburgerMenu}>
			<Dropdown.Toggle className={classes.Toggle} variant="secondary">
				<Hamburger />
			</Dropdown.Toggle>
			{children}
		</Dropdown>
	)
}
