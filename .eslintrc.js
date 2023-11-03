module.exports = {
	extends: './node_modules/@sofie-automation/code-standard-preset/eslint/main',
	plugins: [
		'file-extension-in-import-ts'
	],
	env: {
		node: true,
		jest: true,
	},
	ignorePatterns: ['**/dist/**/*', '**/__tests__/**/*'],
	rules: {
		'no-console': 'warn',
		'file-extension-in-import-ts/file-extension-in-import-ts': 'error',
		'node/no-missing-import': 'off'
	},
}
