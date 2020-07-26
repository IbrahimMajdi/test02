'use static'
require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const ejs = require('ejs');
const methodOverride = require('method-override');

let PORT = process.env.PORT || 3030;
let app = express();
let client = new pg.Client();
app.set('view engine', 'ejs');
app.set("views", ["views/pages", "views/pages/searches"]);

app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.get('/', (req, res) => {
    res.render('index')
})


app.get('/searches/new', newHandler);
app.post('/searches', SearchesHandler);



function newHandler(req, res) {

    res.render('new')
}

function SearchesHandler(req, res) {

    let searchTerm = req.body.searchTerm;
    let searchBy = req.body.searchBy;

    let url = ""
    if (searchBy === 'title') {
        url = `https://www.googleapis.com/books/v1/volumes?q=%20+intitle:${searchTerm}`
    }
    if (searchBy === 'author') {
        url = `https://www.googleapis.com/books/v1/volumes?q=%20+inauthor:${searchTerm}`
    }

    superagent.get(url).then(results => {
        let booksRes = results.body.items.map(book => {
            // console.log(book);

            return new Books(book);
        })
        return booksRes;
    }).then(booksRes => {

        res.render('show', {
            booksInfo: booksRes
        })

    })

}



function Books(book) {


    this.title = book.volumeInfo.title ? book.volumeInfo.title : 'non';
    this.authorName = book.volumeInfo.authors ? book.volumeInfo.authors : 'non';
    this.description = book.volumeInfo.description ? book.volumeInfo.description : 'non';
    this.thumbnail = book.volumeInfo.imageLinks?book.volumeInfo.imageLinks.thumbnail:'non';
}

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})