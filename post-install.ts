const fs = require('fs-extra')
const path = require('path')
require('dotenv').config()
console.log('Post install starting...')

if (!process.env.COPY_TS_MODULE_PROJECTS) {
	console.log('COPY_TS_MODULE_PROJECTS must be either "copy" or "link" in the .env file')
	process.exit(0)
}

function copyModuleSrc (moduleName) {
	const srcDir = path.resolve(path.join('node_modules', moduleName, 'src'))
	const destDir = path.resolve(path.join('modules', moduleName, 'src'))
	console.log(`Copying module "${moduleName}" from "${srcDir}"`)

	if (!fs.existsSync(srcDir)) {
		console.log(`Missing folder "${srcDir}"`)
		process.exit(1)
	}

	console.log(`Destination to copy to: ${destDir}`)
	fs.copySync(srcDir, destDir)
	console.log('Done copying')
}

const modulesArg = process.argv[2]
if (!modulesArg) {
	console.log('Comma separate list of modules to copy is required')
	console.log('Your "postinstall" should look something like "npx ts-node ./node_modules/sw-depender/post-install.ts sw-migrations,sw-testing"')
	process.exit(1)
}

const modules = modulesArg.split(',')
modules.forEach((mod) => {
	copyModuleSrc(mod)
})
