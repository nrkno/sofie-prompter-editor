const glob = require('glob').glob
const path = require('path')
const fs = require('fs').promises
const chokidar = require('chokidar')

/*

(This script is called from packages/apps/client/package.json)
This script monitors the dependencies of the dependent packages in the monorepo and triggers vite to reload when that happens.

*/



const basePath = path.resolve('../../..')
const rootPackage = require(path.join(basePath, 'package.json'))
const clientPackage = require(path.join(basePath, 'packages/apps/client/package.json'))

const viteConfigFile = path.join(basePath, 'packages/apps/client/vite.config.ts')


async function main() {



    // Gather all packages that are dependencies of client
    const packageJsons = []
    for (const workspaceDef of rootPackage.workspaces) {
        const wsPackageJsons = await glob(`${workspaceDef}/package.json`, { cwd: basePath })
        for (const packageJsonPath of wsPackageJsons) {
            if (packageJsonPath.match(/node_modules/)) continue
            // is the package a dependency of client?

            const packageJsonStr = await fs.readFile(path.join(basePath, packageJsonPath))
            const packageJson = JSON.parse(packageJsonStr)

            if (clientPackage.dependencies[packageJson.name]) {
                packageJsons.push(packageJsonPath)
            }

        }
    }

    console.log('packageJsons', packageJsons)


    const watchGlobs = []
    for (const packageJsonPath of packageJsons) {
        const dir = path.dirname(packageJsonPath)

        watchGlobs.push(path.join(basePath, dir, 'dist/**/*'))
    }


    let timeout = null
    const watcher = chokidar.watch(watchGlobs)
    watcher.on('all', (event, path) => {

        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
            timeout = null

            triggerViteReload().catch(console.error)
        }, 500)
    })


}

async function triggerViteReload() {
    console.log('Reloading vite...')

    // Update the file to get vite to trigger a reload:
    const content = await fs.readFile(viteConfigFile)
    await fs.writeFile(viteConfigFile, content)


}
// Wait before starting to watch, to let the initial build finish:
setTimeout(() => {
    console.log('Starting to watch for changes...')
    main().catch((err) => {
        console.error(err)
        process.exit(1)
    })

}, 30 * 1000)


