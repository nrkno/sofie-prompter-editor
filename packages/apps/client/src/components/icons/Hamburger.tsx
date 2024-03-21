import classes from './IconComponent.module.scss'

export default function Hamburger() {
	return (
		<svg
			className={classes.IconComponent}
			width="32"
			height="22"
			viewBox="0 0 32 22"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M1 1H31" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			<path d="M1 11H31" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			<path d="M1 21H31" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
		</svg>
	)
}
