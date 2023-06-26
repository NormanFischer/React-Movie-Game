import * as path from "path";

const fs = require("fs/promises");
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

const OMDB_KEY = process.env.OMDB_KEY;

async function retrieveMovieByID(id: string) {
    const movieJsonUrl = `https://www.omdbapi.com/?i=${id}&apikey=${OMDB_KEY}`;
    const response = await fetch(movieJsonUrl);
    const json = await response.json();
    return json
}

async function getMovieIdsObj() {
    try {
        let obj = new Map<String, String>();
        const data = (await fs.readFile("../ids.txt", "utf8", {encoding: "utf8"}));
        const lines: string[] = data.split("\n");
        for (const line of lines) {
            const movieObj = await retrieveMovieByID(line)
            const movieTitle = movieObj.Title
            obj.set(line, movieTitle);
        }
        return obj;
    } catch(err) {
        console.error(err);
    }
}

//Get a list of five json file movies that will be used during the game
async function getGameMovies(amt: number) {
    try {
        const data = await fs.readFile("../ids.txt", "utf8", {encoding: "utf8"});
        const lines = data.split("\n");
        let done = false;
        let ids: string[] = new Array(amt);
        let count = 0;
        while(!done) {
            const randomID = lines[Math.floor(Math.random()*lines.length)];
            if (!ids.includes(randomID)) {
                ids[count++] = randomID;
            }
            if (count === amt) {
                done = true;
            }
        }
        let objs: Object[] = [];
        for(const id of ids) {
            const movieObj = await retrieveMovieByID(id)
            objs.push(movieObj);
        }
        return objs
    } catch(err) {
        console.error(err);
    }
}

export { getGameMovies, getMovieIdsObj, retrieveMovieByID };