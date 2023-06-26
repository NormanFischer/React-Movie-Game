import * as path from "path";

require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const { MongoClient, ServerApiVersion } = require("mongodb");
import { getHint } from "./hints";
import { getGameMovies, getMovieIdsObj, retrieveMovieByID } from "./omdb";

class MongoWrapper {

    static db: string = process.env.MONGO_DB_NAME!;
    static sessions: string = process.env.MONGO_SESSIONS!;
    static username: string = process.env.MONGO_DB_USERNAME!;
    static password: string = process.env.MONGO_DB_PASSWORD!;
    static cluster: string = process.env.MONGO_DB_CLUSTER!;
    static movies_collection: string = process.env.MONGO_MOVIES!;
    static scores_collection: string = process.env.MONGO_SCORES!;

    private static generateURI() {
        return "mongodb+srv://" + encodeURIComponent(this.username) + ":" + encodeURIComponent(this.password) + "@"
        + this.cluster + "/?retryWrites=true&w=majority";
    }


    static client =
    new MongoClient(this.generateURI(), { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    static async connect() {
        try {
            await this.client.connect();
            console.log("Connected");
        } catch (e) {
            console.log(e);
        }
    }

    static async insertMovieIds() {
        const movie_obj: Map<String, String> | undefined = await getMovieIdsObj();
        if (typeof(movie_obj) === undefined) {
            console.error("Movie object could not be retrieved")
            return
        }

        let arr = []
        for (const [key, val] of Object.entries(movie_obj!)) {
            arr.push({key, val});
        }
        const result = await this.client.db(this.db).collection(this.movies_collection).deleteMany({});
        await this.client.db(this.db).collection(this.movies_collection).insertMany(arr);
    }
    
    static async createGameSession(sessionid: string) {
        const sessions = this.client.db(this.db).collection(this.sessions);

        const session_movies = await (async () => {
            const upper_bound = await this.client.db(this.db).collection(this.movies_collection).countDocuments();
            let session_movies: string[] = [];
            while(session_movies.length !== 5) {
                let movieToAddIndex = Math.floor(Math.random() * upper_bound);
                const cursor = this.client.db(this.db).collection(this.movies_collection)
                    .find()
                    .skip(movieToAddIndex)
                    .limit(1);
                const elt= await cursor.toArray();
                if (!session_movies.includes(elt[0].key)) {
                    session_movies.push(elt[0].key);
                }
            };
            return session_movies;
        })();

        const sessionObj = {
            "sessionID": sessionid,
            "movies": session_movies,
            "score": 100,
            "currentMovie": 0
        };
        sessions.insertOne(sessionObj);
    }

    static async closeConnection() {
        try {
            await this.client.close();
        } catch (e) {
            console.error(e);
        }
    }

    //Called from game sessions
    //When we do a search, the list of movies updates to the qeury
    static async doSearchQuery(query: string) {
        let filter = {val: {$regex: `${query}`, $options: 'i'}};
        const results = this.client
        .db(this.db)
        .collection(this.movies_collection)
        .find(filter)
        .limit(10);

        let ret = await results.toArray();
        return ret;
    }

    static async mongoGetHint(sessionID: string, hintNumber: number) {
        let filter = {sessionID: sessionID};
        const sessionObject = await this.client
        .db(this.db)
        .collection(this.sessions)
        .findOne(filter);

        if (!sessionObject) {
            console.error("Could not retrieve session object");
            return;
        }

        const sessionIndex = await sessionObject.currentMovie;
        const movieID = await sessionObject.movies[sessionIndex];
        const movieObj = await retrieveMovieByID(movieID);
        const hint = getHint(movieObj, hintNumber);
        return hint;
    }

    static async getMovieTitleAndPoster(sessionID: string) {
        let filter = {sessionID: sessionID};
        const sessionObject = await this.client
        .db(this.db)
        .collection(this.sessions)
        .findOne(filter);

        if(!sessionObject) {
            console.error("Could not retrieve session object");
            return;
        }

        const movieID = await sessionObject.movies[sessionObject.currentMovie];
        const movieObj = await retrieveMovieByID(movieID);
        return {title: movieObj.Title, poster: movieObj.Poster};
    }

    static async processGuess(sessionID: string, guessName: string) {
        let filter = {sessionID: sessionID};
        const sessionObject = await this.client
        .db(this.db)
        .collection(this.sessions)
        .findOne(filter);

        if(!sessionObject) {
            console.error("Could not retrieve session object");
            return;
        }

        const sessionIndex = await sessionObject.currentMovie;
        const movieID = await sessionObject.movies[sessionIndex];
        const movieObj = await retrieveMovieByID(movieID);
        const currentMovie = await sessionObject.currentMovie;
        const movieLen = sessionObject.movies.length;

        if(movieObj.Title === guessName) {
            await this.client
            .db(this.db)
            .collection(this.sessions)
            .updateOne(filter, 
                { $inc: {"currentMovie": 1}}
            );
            
            let done = false
            if (currentMovie + 1 >= movieLen) {
                done = true
            }

            return {
                result: true,
                title: movieObj.Title,
                poster: movieObj.Poster,
                done: done
            };
        } else {
            return {
                result: false
            };
        }
    }

    static async updateScoreDelta(sessionID: string, delta: number) {
        function scoreParams(score: number) {
            if (score < 0) {
                return 0;
            } else {
                return score;
            }
        }

        const filter = {sessionID: sessionID};

        const result = await this.client
                            .db(this.db)
                            .collection(this.sessions)
                            .findOne(filter);
        
        if (!result) {
            console.error("Could not find session id");
            return;
        }
        
        const score = result.score;
        const newScore = scoreParams(score + delta);
                            
        await this.client
        .db(this.db)
        .collection(this.sessions)
        .updateOne(filter, 
            { $set: {"score": newScore }}
        );

        return Number(newScore);
    } 

    static async makeLeaderboardPost(name: string, sessionID: string) {
        const scores = this.client.db(this.db).collection(this.scores_collection);
        const sessions = this.client.db(this.db).collection(this.sessions);
        const filter = {sessionID: sessionID};
        const sessionObject = await this.client
        .db(this.db)
        .collection(this.sessions)
        .findOne(filter);

        if(!sessionObject) {
            console.error("Could not retrieve session object");
            return;
        }

        const scoreToPost = sessionObject.score
        const scoreObject = {sessionID: sessionID, score: scoreToPost, name: name};
        await scores.insertOne(scoreObject);
    }

    static async getLeaderboard() {
        const scores = this.client.db(this.db).collection(this.scores_collection);
        const leaderboard = scores.find({}).limit(10).sort({"score": -1});
        const arr = await leaderboard.toArray();
        const list = arr.map((x: { name: string; score: number; })=>  { return {name: x.name, score: x.score}; });
        return list;
    }

    static async incrementMovieIndex(sessionID: string) {
        let filter = {sessionID: sessionID};

        await this.client
            .db(this.db)
            .collection(this.sessions)
            .updateOne(filter, 
                { $inc: {"currentMovie": 1}}
            );
    }

    static async isDone(sessionID: string) {
        let filter = {sessionID: sessionID};
        const sessionObject = await this.client
        .db(this.db)
        .collection(this.sessions)
        .findOne(filter);

        const currentMovie = await sessionObject.currentMovie;
        const movieLen = sessionObject.movies.length;
        
        let done = false
        if (currentMovie >= movieLen) {
            done = true
        }
        return done;
    }

    static async deleteAllSessions() {
        await this.client.db(this.db).collection(this.sessions).deleteMany({});
    }

    static async deleteAllScores() {
        await this.client.db(this.db).collection(this.scores_collection).deleteMany({});
        //Inject a default top-3 scores after every reset
        const default_score1 = {score: 250, name: "John"};
        const default_score2 = {score: 100, name: "Larry"};
        const default_score3 = {score: 300, name: "Mary"};
        const scores = [default_score1, default_score2, default_score3];
        await this.client.db(this.db).collection(this.scores_collection).insertMany(scores);
    }
}

export { MongoWrapper };