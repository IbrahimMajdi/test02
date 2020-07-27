'use static'
require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const ejs = require('ejs');
// const methodOverride = require('method-override');

let PORT = process.env.PORT || 3030;
let app = express();
let client = new pg.Client(process.env.DATABASE_URL);

app.set('view engine', 'ejs');
app.set("views", ["views/pages", "views/pages/searches"]);

app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.get('/', mainHandler)


app.get('/searches/new', newHandler);
app.post('/searches', SearchesHandler);
app.post('/book', addHandler);
app.get('/books/:book_id', detailsHandler);
app.post('/update/:book_id',updateHandler);
app.post('/delete/:book_id',deleteHandler)


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

function mainHandler(req, res) {

    let SQL = `SELECT * FROM books;`;
    client.query(SQL).then(result => {
        res.render('index', {
            DBresult: result.rows,
            booksNum: result.rowCount
        })
    })

}


function addHandler(req, res) {

    let bookData = req.body;

    let SQL = `INSERT INTO books (title,description,thumbnail,identifier) VALUES ($1,$2,$3,$4);`;
    let values = [bookData.title,bookData.description,bookData.thumbnail,bookData.identifier];

    console.log("values addhandler",values);

    client.query(SQL, values).then(() => {

        let SQL2 = `SELECT * FROM books WHERE identifier=$1;`;
        let value = [bookData.identifier];

            console.log("bookIDent",value);

        client.query(SQL2, value).then(result => {
            console.log('result.rows[0].id',result.rows[0].id);
            res.redirect(`/books/${result.rows[0].id}`)
        })

    })
}


function detailsHandler(req, res) {

    let SQL = `SELECT * FROM books WHERE id=$1;`;
    let value = [req.params.book_id];

        console.log('params',value);
        
    client.query(SQL, value).then(result => {
        console.log('result.rows[0]',result.rows[0]);

        res.render('detail', {
            bookDetail:result.rows[0]
        })
    })




}


function updateHandler(req,res){

    let {title,description,thumbnail,identifier}= req.body;

    let SQL=`UPDATE books SET title=$1,description=$2,thumbnail=$3,identifier=$4 WHERE id=$5;`;
    let id =req.params.book_id
    let values = [title,description,thumbnail,identifier,id];

    client.query(SQL,values).then(()=>{
        res.redirect(`/books/${id}`)
    })
}

function deleteHandler (req,res){
    let SQL=`DELETE FROM books WHERE id=$1;`;
    let value=[req.params.book_id];

    client.query(SQL,value).then(()=>{
        res.redirect('/')
    })


}
function Books(book) {


    this.title = book.volumeInfo.title ? book.volumeInfo.title : 'non';
    this.authorName = book.volumeInfo.authors ? book.volumeInfo.authors : 'non';
    this.description = book.volumeInfo.description ? book.volumeInfo.description : 'non';
    this.thumbnail = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : 'non';
    this.identifier = book.volumeInfo.industryIdentifiers ? book.volumeInfo.industryIdentifiers[0].identifier : 'not avilable';
}

client.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`listening on port ${PORT}`)
    })
})