#!/bin/bash

branch=$(git symbolic-ref --short -q HEAD)
commit=$(git rev-parse HEAD)
git checkout gh-pages

git checkout master assets
git checkout master index.html

cd assets
NODE_ENV=production webpack
cd ..

rm -rf assets
git rm -r assets 2>&1 > /dev/null
git add build index.html

git commit -m "Automated build ($commit)"

if [ "$1" == "--push" ]; then git push origin gh-pages

git checkout $branch
