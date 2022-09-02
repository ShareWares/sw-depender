const fs = require('fs-extra')
const chokidar = require('chokidar')
const path = require('path')

type Dependent = {
	key: string,
	modulesDir: string
	outputSrcDir: string
}

type Config = {
	dependents: Dependent[]
}

const dependentsJSONPath = path.resolve(path.join('dependents.json'))
const buildsJSONPath = path.resolve(path.join('builds.json'))
const packageJSONPath = path.resolve(path.join('package.json'))



if (!fs.existsSync(dependentsJSONPath)) {
	fs.writeFileSync(dependentsJSONPath, JSON.stringify({dependents: []}, null, 2), 'utf-8')
	console.log('CONFIG FILE CREATED @ ' + dependentsJSONPath)
	console.log('Edit that file and restart script')
	process.exit(1)
}

function writeBuildTimes () {
	fs.writeFileSync(buildsJSONPath, JSON.stringify(buildTimes, null, 2), 'utf-8')
}

let buildTimes : Record<string, number> = {}
if (!fs.existsSync(buildsJSONPath)) {
	buildTimes = {}
	writeBuildTimes()
}

const configJSON = fs.readFileSync(dependentsJSONPath, 'utf-8')
const config = JSON.parse(configJSON) as Config
const packageJSON = fs.readFileSync(packageJSONPath, 'utf-8')
const pkg = JSON.parse(packageJSON)
const packageName = pkg.name
const srcDir = path.resolve(path.join('./src'))

console.log('Watching this dir: ' + srcDir)

config.dependents = config.dependents.map((dep) => {
	return {
		...dep,
		outputSrcDir: path.join(dep.modulesDir, packageName, 'src')
	}
})

/**/
// TODO: watch modules dirs we are copying to for changes
// If these happen, we can pause our updating.
// This is in case someone edits those files
config.dependents.forEach((dep) => {
	if (!fs.existsSync(dep.modulesDir)) {
		console.log('ERROR: modules dir for ' + dep.key + ' does not exist: ' + dep.modulesDir)
		process.exit(1)
	}

	console.log(`Will copy to project "${dep.key}" @ "${dep.outputSrcDir}"`)
	chokidar.watch(dep.modulesDir).on('all', (_, changedPath) => {
		const diff = Date.now() - buildTimes[dep.key]
		if (isNaN(diff)) {
			return
		}
		if(Math.abs(diff) > 100) {
			console.log('Error, file edited directly: ' +  changedPath)
			console.log('Module files cant be edited directly, they must be edited in source dir: ' + srcDir)
			console.log('Edit them in the src directory, then they will then be copied to modules dir')
			process.exit(1)
		}
	})
})
/**/

console.log('.')
let copyTimeout = null
let hasLoaded = false
chokidar.watch(srcDir).on('all', (event, eventPath) => {
	clearTimeout(copyTimeout)
	if (hasLoaded) {
		console.log(`New event "${event}"@"${eventPath}"`)
	}
	copyTimeout = setTimeout(() => {
		console.log('-----')
		hasLoaded = true
		console.log('Copying src to dependents.')
		const revision = require('child_process')
			.execSync('git rev-parse HEAD')
			.toString().trim()
		config.dependents.forEach((dep) => {
			const dest = dep.outputSrcDir
			console.log(`
Copying "${pkg.name}" @ "${srcDir}" 
into "${dep.key}" @ "${dep.outputSrcDir}"`)
			fs.copySync(srcDir, dest)
			buildTimes[dep.key] = Date.now()
			const buildInfo = `Copied at: ${new Date()}
Copied from: ${__dirname}
Package name: ${pkg.name}
Git hash: ${revision}`
			fs.writeFileSync(path.join(dep.modulesDir, packageName, 'build.txt'), buildInfo, 'utf-8')

			writeBuildTimes()
		})
		console.log('-----')
	}, 10)
})
