/* eslint-disable node/no-unpublished-require */
const glob = require('glob').glob
const rimraf = require('rimraf').rimraf


/*
	Removing all /node_modules and /dist folders
*/

const basePath = '.'

async function main() {
	log('Gathering files to remove...')

	// Remove things that arent used, to reduce file size:
	const searchForFolder = async (name) => {
		return [
			...(await glob(`${basePath}/${name}`)),
			...(await glob(`${basePath}/*/${name}`)),
			...(await glob(`${basePath}/*/*/${name}`)),
			...(await glob(`${basePath}/*/*/*/${name}`)),
			...(await glob(`${basePath}/*/*/*/*/${name}`)),
		]
	}
	const allFolders = [
		...(await searchForFolder('node_modules')),
		...(await searchForFolder('dist')),
		...(await searchForFolder('deploy')),
	]
	const resultingFolders = []
	for (const folder of allFolders) {
		let found = false
		for (const resultingFolder of resultingFolders) {
			if (folder.match(resultingFolder)) {
				found = true
				break
			}
		}
		if (!found) {
			resultingFolders.push(folder)
		}
	}

	const rootNodeModules = await glob(`${basePath}/node_modules`)
	if (rootNodeModules.length !== 1) throw new Error(`Wrong length of root node_modules (${rootNodeModule.length})`)
	const rootNodeModule = rootNodeModules[0]

	log(`Removing ${resultingFolders.length} files...`)
	for (const folder of resultingFolders) {
		if (folder === rootNodeModule) continue
		log(`Removing ${folder}`)
		await rimraf(folder)
	}

	// Finally, remove root node_modules
	for (const folder of resultingFolders) {
		log(`Removing ${folder}`)
		await rimraf(folder)
	}

	log(`...done!`)
}

main().catch(log)

function log(...args) {
	// eslint-disable-next-line no-console
	console.log(...args)
}
