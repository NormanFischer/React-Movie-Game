interface NameEntry {
    sessionID: string
}

function NameEntryContainer(props: NameEntry) {

    return (
        <div className="alertContainer" id="nameEntryContainer">
        <div className="alertContainerWindow" id="nameEntry">
             <form action="/leaderboard" method="post">
                <label>
                Enter Your Name: <input type="text" id="name" name="name"/>
                </label>
                <input type="submit"/>
                <input type="hidden" name="sessionID" value={props.sessionID}/>
             </form>
        </div>
        </div>
    )
}

export default NameEntryContainer;