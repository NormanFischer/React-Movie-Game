
function Help() {
    return( 
        <>
            <h1>Help</h1>
            <p>To play the game, you will be presented with a sequence of five movies</p>
            <p>You will be given various information about the movie including:</p>
            <div id="helpdiv">
                <ul id="help">
                    <li>The crew-members of the movie</li>
                    <li>The plot of the movie</li>
                    <li>The release date, runtime, and genre</li>
                    <li>Any other miscellaneous information about the movie</li>
                </ul>
            </div>
            
            <p>A first guess with only one hint will score you 100pts</p>
            <p>If you are stuck, you can use a hint to get more information about the movie.</p>
            <p>Subsequent hints and incorrect guesses will deduct your score by 10pts</p>
            <p>Skipping a Question will also deduct your score by 100pts</p>
            <div className="link">
                <a href="/" className="linkButton">Home</a>
            </div>
        </>
    );
}

export default Help;
