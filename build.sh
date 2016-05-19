#!/bin/bash

branch=$(git symbolic-ref --short -q HEAD)
commit=$(git rev-parse HEAD)
git checkout gh-pages

git checkout $branch assets
git checkout $branch index.html

cd assets
NODE_ENV=production webpack
cd ..

rm -rf assets
git rm -r assets 2>&1 > /dev/null
git add -f build index.html

git commit -m "Automated build ($commit)"

if [[ "$1" -eq "--push" ]]; then
	git push origin gh-pages;
	git checkout $branch
fi

