import * as path from "path";
const DEFAULT_PORT = 5000;
const NUM_QUESTIONS = 5;
const SKIP_DELTA = -100;
const http = require("http");
const bodyParser = require("body-parser");
const express = require("express");
import { MongoWrapper } from "./mongo";
const { randomUUID } = require("crypto");

import {Request, Response} from "express"
const app = express();

/* WARNING: setting this to true will cause a mass-api request to refresh the mongodb database */
const REFRESH_DATABASE = false;

let portNumber = DEFAULT_PORT;

/* Argument parsing */
if (process.argv.length == 2) {
    console.log(`Starting Movie Game Server with default port: ${DEFAULT_PORT}`);
} else if (process.argv.length == 3) {
    portNumber = Number(process.argv[2]);
    if (portNumber) {
        console.log(`Starting Movie Game with custom port: ${portNumber}`);
    } else {
        console.log(`Cannot parse portNumber from string: ${process.argv[2]}, aborting`);
        process.exit(1);
    }
} else {
    console.log("Usage: node movieGameServer.js PORT_NUMBER");
    process.exit(0);
}

app.set("views", path.resolve(__dirname, "public"));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public/dist'));
app.use(express.json());
app.use(bodyParser.urlencoded({extended:false}));

(async() => {
    console.log("Connecting to MongoDB database");
    await MongoWrapper.connect();
})();

/* Every time the server starts, we log a list of movie Ids and their titles on MongoDB */
/* This process is slow, so it should only be enabled if you are ready to make hundreds of api calls */
if (REFRESH_DATABASE) {
    (async () => {
        await MongoWrapper.insertMovieIds();
    })();
}

app.get("/", (req: Request, res: Response) => res.sendFile(path.resolve("public", "dist", "index.html")));
app.get("/gameSession", (req: Request, res: Response) => res.sendFile(path.resolve("public", "dist", "index.html")));
app.get("/leaderboard", (req: Request, res: Response) => res.sendFile(path.resolve("public", "dist", "index.html")));
app.get("/help", (req: Request, res: Response) => res.sendFile(path.resolve("public", "dist", "index.html")));

app.get("/api/search", async (req: Request, res: Response) => {
    const query: string = req.query.query as string;
    const results = await MongoWrapper.doSearchQuery(query);
    res.json(results);
});

app.get("/api/getLeaderboard", async (req: Request, res: Response) => {
    const leaderboard = await MongoWrapper.getLeaderboard();
    res.json(leaderboard);
});

app.post("/api/newGameSession", async (req: Request, res: Response) => {
    const sessionid: string = randomUUID();
    await MongoWrapper.createGameSession(sessionid);
    const variables = {
        "sessionID": sessionid
    };
    res.json(variables);
});

app.get("/api/getHint", async (req: Request, res: Response) => {
    const sessionid = String(req.query.sessionID);
    const hintNumber = Number(req.query.hintNumber);

    //Retrieve hint with an api call
    const hint = await MongoWrapper.mongoGetHint(sessionid, hintNumber);

    //Hints deduct 10 pts
    //Only change score if we are in valid hint range
    let newScore;
    if (hintNumber !== 1 && hintNumber <= 5) {
        newScore = await MongoWrapper.updateScoreDelta(sessionid, -10);
    } else {
        newScore = await MongoWrapper.updateScoreDelta(sessionid, 0);
    }

    res.json({hint: hint, newScore: newScore});
});

app.post("/api/makeGuess", async (req: Request, res: Response) => {
    const sessionID = req.body.sessionID;
    const guessName = req.body.guessName;
    const result = await MongoWrapper.processGuess(sessionID, guessName);

    if (result === undefined) {
        res.status(500).send("Error occurred upon processing guess");
        return;
    }

    let delta = 0;
    //Update score
    if (result.result) {
        delta = 100;
    } else {
        delta = -10;
    }

    const newScore = await MongoWrapper.updateScoreDelta(sessionID, delta);

    if (result.result) {
        res.json({
            result: result.result, 
            newScore: newScore,
            title: result.title,
            poster: result.poster,
            done: result.done
        });
    } else {
        res.json({result: result.result, newScore: newScore});
    }
});

app.post("/api/skip", async (req: Request, res: Response) => {
    const sessionID = req.body.sessionID;

    //Skips cost 100 points
    const newScore = await MongoWrapper.updateScoreDelta(sessionID, SKIP_DELTA);
    const movieObj = await MongoWrapper.getMovieTitleAndPoster(sessionID);
    if (movieObj === undefined) {
        res.status(500).send("Error occurred upon retrieving movie title and poster");
        return;
    }
    await MongoWrapper.incrementMovieIndex(sessionID);
    const done = await MongoWrapper.isDone(sessionID);

    res.json({title: movieObj.title, poster: movieObj.poster, newScore: newScore, done: done});
});

app.post("/leaderboard", async (req: Request, res: Response) => {
    const sessionID = req.body.sessionID;
    const name = req.body.name;
    //Making a leaderboard post when the game ends
    await MongoWrapper.makeLeaderboardPost(name, sessionID);
    res.redirect("/leaderboard")
});

app.listen(DEFAULT_PORT);
console.log("Listening on port: " + DEFAULT_PORT);

//CLI admin controls
process.stdin.setEncoding("utf8");
process.stdin.on("data", (dataInput: string) =>  {
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "clearsessions") {
            console.log("Cleaing sessions collection");
            (async() => {
                await MongoWrapper.deleteAllSessions();
            })(); 
            console.log("Sessions cleared!");
        } else if (command === "clearscores") {
            console.log("Clearing leaderboards");
            (async () => {
                await MongoWrapper.deleteAllScores();
            })();
            console.log("Leaderboards cleared!");
        } else {
            process.stdout.write(`Invalid command: ${dataInput}`);
        }
    }
});
