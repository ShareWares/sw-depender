# Depender
This is a way to write TypeScript in one repository, and share it to others.

Traditional methods were proving to be very difficult to work with.

## New Module Process
 - Create a new TypeScript module (call it `sw-util` as an example)
 - Install `sw-depender` in `sw-util`
 - Set up an npm script in package.json for sw-util like so `"depend": "npx ts-node ./node_modules/sw-depender/update-dependents.ts"`
 - Create a `dependents.json` file in the `sw-util` folder (use dependents.example.json as a starting point)
 - Add any projects that will use `sw-util` into that JSON file
 - In `sw-util` folder do `npm run depend` and then any changes you make to TS files will be automatically **copied** to the dependent's `module` folder

## Using Modules
 - In your code, you can import the TS using relative paths (eg `import {helper} from "../modules/sw-util/src/helpers"`)
 - Add the dependents to your dependencies in your package.json
 - Add a postinstall script to your package.json to copy the files from node_modules into modules
 - `"postinstall": "npx ts-node ./node_modules/sw-depender/post-install.ts sw-util,sw-other-package"`
