#!/bin/bash

#git checkout -b $1

#{ echo -e "### $1\nNew Features\n - \n\nBug Fixes:\n - \n\n"; cat CHANGELOG.md; } > tmpfile && mv tmpfile CHANGELOG.md
jq  ".version = \"$1\"" module.json >> tmpfile && mv tmpfile module.json


git add module.json CHANGELOG.md
