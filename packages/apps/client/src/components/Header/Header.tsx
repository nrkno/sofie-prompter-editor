import React from 'react'
import classes from './Header.module.scss'

export function Header({ children }: React.PropsWithChildren) {
	return <header className={classes.Header}>{children}</header>
}
