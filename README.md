# React-Movie-Game
Movie guessing game using top movies from IMDB.
You will need a MongoDB account and an OMDB API access key to run this application.
Create a .env file with the following parameters
1. OMDB_KEY
2. MONGO_DB_USERNAME
3. MONGO_DB_PASSWORD
4. MONGO_DB_CLUSTER
5. MONGO_DB_NAME
6. MONGO_SESSIONS
7. MONGO_MOVIES
8. MONGO_SCORES

Run the python scraper to fetch movie IDs from IMDB:
``` 
python3 scraper.py
 ```
 
Then, build the react project, compile the TypeScript, and start the server:
```
sh build.sh
sh run.sh
```
