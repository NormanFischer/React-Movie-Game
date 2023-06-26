from bs4 import BeautifulSoup
import requests

#Scraper for top 1000 movies on IMDB by id
URL1 = "https://www.imdb.com/search/title/?count=250&groups=top_1000&ref_=adv_prv"
URL2 = "https://www.imdb.com/search/title/?groups=top_1000&count=250&start=251&ref_=adv_nxt"
URL3 = "https://www.imdb.com/search/title/?groups=top_1000&count=250&start=501&ref_=adv_nxt"
URL4 = "https://www.imdb.com/search/title/?groups=top_1000&count=250&start=751&ref_=adv_nxt"

file = open("ids.txt", "w")

print("Scraping top 1000 ids from IMDB")

pages = map(lambda x: requests.get(x), [URL1, URL2, URL3, URL4])

for page in pages:
    html_doc = page.content

    soup = BeautifulSoup(html_doc, 'html.parser')

    main = soup.find(id="main")
    list_header = main.find("div", class_="lister-list")
    
    idElements = list_header.findAll("div", class_="lister-item mode-advanced")

    for idElt in idElements:
        movie_id_class = idElt.find("img", class_="loadlate")
        file.write(movie_id_class["data-tconst"] + "\n")

print("Done writing! Closing file")
file.close()
