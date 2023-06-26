import './style.css'

function Index() {
  return (
    <>
      <h1>Movie Game</h1>
      <h3>Take a guess from the top 1000 IMDB movies and get the high score!</h3>
      <div className="link">
        <a href="/gameSession" className="linkButton">Start the game!</a>
      </div>

      <div className="link">
        <a href="/help" className="linkButton">Help</a>
      </div>

      <div className="link">
        <a href="/leaderboard" className="linkButton">View Leaderboard</a>
      </div>
    </>
  )
}

export default Index;
