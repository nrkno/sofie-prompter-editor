/* eslint-disable node/no-unpublished-require */
const promisify = require('util').promisify
const glob = require('glob').glob
const deepExtend = require('deep-extend')
const fs = require('fs')
// const glob = promisify(globOrg)
const fsReadFile = promisify(fs.readFile)
const fsWriteFile = promisify(fs.writeFile)

/*
This script copies some common properties (from commonPackage.json)
into package.json of each of the packages.
*/

const rootPackage = require('../package.json')

async function main() {
	let updatedCount = 0
	const extendPackageStr = await fsReadFile('commonPackage.json')
	const extendPackage = JSON.parse(extendPackageStr)
	delete extendPackage.description // don't copy this property

	for (const workspaceDef of rootPackage.workspaces) {
		const packageJsons = await glob(`${workspaceDef}/package.json`)
		for (const packageJsonPath of packageJsons) {
			try {
				if (!packageJsonPath.match(/node_modules/)) {
					const packageJsonStr = await fsReadFile(packageJsonPath)
					const packageJson = JSON.parse(packageJsonStr)

					const newPackageJson = deepExtend({}, packageJson, extendPackage)

					if (JSON.stringify(newPackageJson) !== JSON.stringify(packageJson)) {
						await fsWriteFile(packageJsonPath, JSON.stringify(newPackageJson, undefined, 4))
						console.log(`Updated ${packageJsonPath}`)
						updatedCount++
					}
				}
			} catch (err) {
				console.error(`Error when processing ${packageJsonPath}`)
				console.error(err)
				process.exit(1)
			}
		}
	}

	if (updatedCount) {
		console.log(`Updated package.json of ${updatedCount} packages`)
		console.log(`You should commit these changes and run yarn install again.`)
		process.exit(1)
	}
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
