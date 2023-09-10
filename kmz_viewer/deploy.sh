mkdir deploy
npx tsc
cp -R ./dist/ ./deploy/dist/
cp index.html ./deploy
cp index.css ./deploy
cp -R ./data/VT_*_TM.kmz ./deploy/data/