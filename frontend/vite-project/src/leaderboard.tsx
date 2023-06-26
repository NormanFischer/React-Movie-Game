import {useState, useEffect} from 'react'

interface TableRowEntry {
    position: number;
    name: string;
    score: number;
}

interface LeaderboardTableData {
    data: TableRowEntry[]
}

function TableRow(props: TableRowEntry) {
    const {position, name, score} = props;
    return(
        <tr>
            <td>{position}</td>
            <td>{name}</td>
            <td>{score}</td>
        </tr>
    );
}

function LeaderboardTable(props: LeaderboardTableData) {
    const {data} = props
    return(
        <table>
            <tbody>
                {
                    data.map(row => {
                        return <TableRow position={row.position} name={row.name} score={row.score} />
                    })
                }
            </tbody>
        </table>        
    )
}

function Leaderboard() {
    const [table, setTable] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/getLeaderboard")
            .then(response => response.json())
            .then((json) => {
                console.log("Got table");
                console.log(json);
                setTable(json);
            })
            .catch((e) => {
                console.log("Error");
                setError(`Error loading: ${e}`);
            });
    }, []);

    return (
        <>
            <h1>Leaderboard</h1>
            <div id="leaderboardTable"></div>
                <p>{error}</p>
                <LeaderboardTable data={table}/>
            <div className="link">
                <a href="/" className="linkButton">Home</a>
            </div>
        </>
    )
}

export default Leaderboard;