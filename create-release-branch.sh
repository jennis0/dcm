#!/bin/bash


git pull origin main
git checkout main
git checkout -b ${1}-dev

jq  ".version = \"$1\"" module.json >> tmpfile && mv tmpfile module.json

git add module.json
git commit -m "Create dev branch for $1"
git push origin ${1}-dev