#!/bin/bash

npm i
npm run build:source
npm run build:db
zip module.zip CHANGELOG.md LICENSE module.json README.md templates/ styles/ scripts/ packs/dcm-journals/ 
git add .
git commit -m "Build release $1"
git tag $1

