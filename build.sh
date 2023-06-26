echo "Building vite application for production..."
cd frontend/vite-project
vite build
if [ -d "../../node/public/dist" ];
then
    echo "Removing old dist directory"
    rm -rf ../../node/public/dist
fi
mv -f ./dist ../../node/public
echo "Vite application built"
echo "Compiling backend..."
cd ../..
tsc ./node/movieGameServer.ts
echo "Type sh run.sh to start"