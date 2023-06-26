import { useEffect, useState } from "react";
import NameEntryContainer from "./nameEntryContainer";

enum ResponseType {
    Correct,
    Incorrect,
    Skip
}

function GameSession() {
    const [sessionID, setSessionID] = useState(null);

    useEffect(() => {
        try {
            fetch("/api/newGameSession", {method: "post"})
            .then((res) => res.json())
            .then((json) => {
                setSessionID(json.sessionID);
            });
          } catch (e) {
            //TODO: Show error
            console.log("ERROR")
            console.error(e);
          }
    },[]);

    return(
        <>
            <h1>Game Session</h1>
            { sessionID && <GameController sessionID={sessionID!} /> }
        </>
    )
}

export default GameSession;

interface gameControllerProps {
    sessionID: string
}

type AnswerObject = {
    movieTitle: string,
    moviePoster: string,
    done: boolean
}

function GameController(props: gameControllerProps) {
    const [localScore, setLocalScore] = useState(100);
    const [showQuestionResponse, setQuestionResponse] = useState(false);
    const [showNameEntry, setNameEntry] = useState(false);
    const [answerResponseType, setAnswerResponseType] = useState<ResponseType | undefined>(undefined);
    const [answerObject, setAnswerObject] = useState<AnswerObject | null>(null);
    const [searchResults, setResults] = useState([]);
    const [hints, setHints] = useState<string[]>([]);
    const [hintNumber, setHintNumber] = useState(1);
    const [trigger, triggerHint] = useState(false);
    const [guessText, setGuessText] = useState("");

    function dismissAlertContainer() {
        setQuestionResponse(false);
    }

    function goToNext(done: boolean) {
        if (done) {
            setNameEntry(true);
        } else {
            console.log("Processing next question")
            setQuestionResponse(false);
            setAnswerResponseType(undefined);
            setAnswerObject(null);
            setGuessText("");
            setResults([]);
            setHints([]);
            setHintNumber(1);
            triggerHint(h => !h);
        }
    }

    async function processGuess() {
        try {
            const response = await fetch(`/api/makeGuess`, {
                method: "POST",
                    body: JSON.stringify({
                        sessionID: props.sessionID,
                        guessName: guessText
                    }),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
            });
            const json = await response.json();
            const correct = json.result;
            const newScore = json.newScore;

            if (correct) {
                setAnswerResponseType(ResponseType.Correct);
                const title = json.title;
                const poster = json.poster;
                const done = json.done;
                setAnswerObject({movieTitle: title, moviePoster: poster, done: done});
            } else {
                setAnswerResponseType(ResponseType.Incorrect);
            }
            setQuestionResponse(true);
            setLocalScore(newScore);
        } catch(err) {
            console.error(err);
        }
    }

    async function processSkip() {
        try {
            const response = await fetch(`/api/skip/`, {
                method: "POST",
                    body: JSON.stringify({
                        sessionID: props.sessionID
                    }),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
            });
            const json = await response.json();
            const title = json.title;
            const poster = json.poster;
            const done = json.done;
            const newScore = json.newScore;
            setLocalScore(newScore);
            setAnswerResponseType(ResponseType.Skip);
            setQuestionResponse(true);
            setAnswerObject({movieTitle: title, moviePoster: poster, done: done});
        } catch (e) {
            console.error(e);
        }
    }

    async function getHint() {
        const response = await fetch(`/api/getHint?sessionID=${props.sessionID}&hintNumber=${hintNumber}`);
        const json = await response.json();
        const hintText: string = json.hint;
        setHints(h => [...h, hintText]);
        setLocalScore(json.newScore);
    }

    async function doSearch(searchQuery: string) {
        const toSearch: string = searchQuery.trim();
        try {
            const response = await fetch(`/api/search?query=${toSearch}`);
            if (!response.ok) {
                throw new Error("Response error");
            }
            const results = await response.json();
            setResults(results);
            console.log(results);
        } catch (err) {
            console.log(err);
        }
    }

    //Get hint
    useEffect(()=> {
        console.log("Getting hint");
        getHint();
    }, [trigger]);

    return (
        <>
            <p></p>
            <h2>Session ID: {props.sessionID}</h2>
            <h2>Score: {localScore}</h2>
            <button onClick={() => setHints([])}>Clear hints</button>
            { showQuestionResponse && <QuestionResponseContainer responseType={answerResponseType!}
                                                                 answerObject={answerObject}
                                                                 dismissAlertContainer={dismissAlertContainer} 
                                                                 goToNext={goToNext}/>}
            { showNameEntry && <NameEntryContainer sessionID={props.sessionID}/>}
            <h2>Hints</h2>
            <HintList hints={hints}/>
    
            <input type="text" id="searchMovies" value={guessText} placeholder="Search for movies" onChange={(e) => {
                setGuessText(e.target.value);
                if (e.target.value.length > 0) {
                    doSearch(e.target.value);
                } else {
                    setResults([]);
                }
            }}/>

            <div id="buttons">
                <button type="button" id="makeGuess" onClick={() => processGuess()}>Guess</button>
                <button type="button" id="getHint" onClick={() => {
                    setHintNumber(h => h + 1);
                    triggerHint(h => !h);
                }}>
                    Get a Hint (-10 pts)
                </button>
                <button type="button" id="skip" onClick={() => processSkip()}>Skip (-100 pts)</button>
            </div>

            <MovieSearchResults results={searchResults} setResults={setResults} setGuessText={setGuessText} />
        </>
    )
}

interface hints {
    hints: string[]
}

function HintList(props: hints) {
    return (
        <ol id="hints">
            {props.hints.map((hint: string) => <li>{hint}</li>)}
        </ol>
    )
}

interface searchResults {
    results: {id: string, key: string, val: string}[],
    setResults: Function,
    setGuessText: Function
}

function MovieSearchResults(props: searchResults) {
    return(
        <ul id="query">
            {props.results.map((searchResult) => <li onClick={() => {
                props.setGuessText(searchResult.val);
                props.setResults([]);
            }}>{searchResult.val}</li>)}
        </ul>
    )
}

interface QuestionResponse {
    responseType: ResponseType,
    answerObject: AnswerObject | null,
    dismissAlertContainer: Function,
    goToNext: Function
}

function QuestionResponseContainer(props: QuestionResponse) {
    function getResponseType(res: ResponseType) {
        switch(res) {
            case ResponseType.Correct:
                return <CorrectAnswer answerObj={props.answerObject!} goToNext={props.goToNext}/>
            case ResponseType.Incorrect:
                return <IncorrectAnswer dismissAlertContainer={props.dismissAlertContainer}/>
            case ResponseType.Skip:
                return <SkippedAnswer answerObj={props.answerObject!} goToNext={props.goToNext}/>
        }
    }

    return (
        <>
            <div className = "alertContainer">
                <div className="alertContainerWindow">
                    {getResponseType(props.responseType)}
                </div>
            </div>
        </>
    )
}

interface CorrectAnswer {
    answerObj: AnswerObject
    goToNext: Function
}

function CorrectAnswer(props: CorrectAnswer) {
    return (
        <>
            <h3>Correct!</h3>
            <img src={props.answerObj.moviePoster}></img>
            <strong>{props.answerObj.movieTitle}</strong>
            <button onClick={async () => await props.goToNext(props.answerObj.done)}>Ok</button>
        </>
    )
}

function IncorrectAnswer(props: {dismissAlertContainer: Function}) {
    return (
        <>
            <h3>Incorrect</h3>
            <button onClick={() => props.dismissAlertContainer()}>Ok</button>
        </>
    )
}

function SkippedAnswer(props: CorrectAnswer) {
    return (
        <>
            <img src={props.answerObj.moviePoster}></img>
            <strong>{props.answerObj.movieTitle}</strong>
            <button onClick={async () => await props.goToNext(props.answerObj.done)}>Ok</button>
        </>
    )
}