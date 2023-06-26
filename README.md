# React-Movie-Game
Movie guessing game using top movies from IMDB.
You will need a MongoDB account and an OMDB API access key to run this application.
Create a .env file with the following parameters
OMDB_KEY
MONGO_DB_USERNAME
MONGO_DB_PASSWORD
MONGO_DB_CLUSTER
MONGO_DB_NAME
MONGO_SESSIONS
MONGO_MOVIES
MONGO_SCORES

Run the python scraper to fetch movie IDs from IMDB:
``` python3 scraper.py ```
Then, build the react project, compile the TypeScript, and start the server:
```
sh build.sh
sh run.sh
```
