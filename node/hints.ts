interface imdbObj {
    Plot: string,
    Released: number,
    Genre: string,
    Actors: string,
    BoxOffice: string,
    Awards: string
}

function getYearHint(Released: number) {
    return `This movie was released on: ${Released}`
}

function getGenreAndActorsHint(Genre: string, Actors: string) {
    return `This is a ${Genre} movie and stars ${Actors}`
}

function getBoxOfficeAndAwardsHint(BoxOffice: string, Awards: string) {
    return `This movie made ${BoxOffice} at the box office and ${Awards}`
}

function getPlot(Plot: string) {
    return `${Plot}`;
}

//We create a list of strings that are the hints that will be
//used for a movie
function getHint(imdbJsonObj: imdbObj, hintNumber: number) {
    if (hintNumber === 1) {
        return getPlot(imdbJsonObj.Plot);
    } else if (hintNumber === 2) {
        return getYearHint(imdbJsonObj.Released);
    } else if (hintNumber === 3) {
        return getGenreAndActorsHint(imdbJsonObj.Genre, imdbJsonObj.Actors);
    } else if (hintNumber === 4) {
        return getBoxOfficeAndAwardsHint(imdbJsonObj.BoxOffice, imdbJsonObj.Awards);
    } else {
        return "Invalid hint number"
    }
}

export { getHint }