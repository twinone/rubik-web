#!/bin/bash
commit=$(git rev-parse dev)

git checkout gh-pages || (echo "Abort" && exit)
git merge dev -m "Merge branch 'dev' into gh-pages"

NODE_ENV=production webpack

git add -f 'build/*.js'
git commit -m "Automated build ($commit)"

if [[ "$1" -eq "--push" ]]; then
	git push origin gh-pages;
fi

