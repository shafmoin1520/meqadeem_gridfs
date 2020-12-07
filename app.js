const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto'); //to generate the file names
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

const app = express();

//MiddleWare
app.use(bodyParser.json());
app.use(methodOverride('_method'));
//Setting View Engine
app.set('view engine', 'ejs');

//Mongo URI
const MongoURI = "mongodb+srv://meanapp:AEKzArBnCBP1ehTH@cluster0.fgaaw.mongodb.net/mongouploads";

//Create Mongo connection
const conn = mongoose.createConnection(MongoURI);

//Initialize gfs - ref: https://github.com/aheckmann/gridfs-stream
let gfs;
conn.once('open', () => {
    //Init Stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    // all set!
})

//Create Storage Engine - ref: https://github.com/devconcept/multer-gridfs-storage
const storage = new GridFsStorage({
    url: MongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });

// @route GET /
// @desc Loads form
app.get('/', (req, res) => {
    res.render('index');
});

// @route POST /upload
// @desc Uploads file to DB - upload.single('file') -> middleware with field name as file
app.post('/upload',upload.single('file'), (req, res)=>{
    // res.json({file:req.file});
    res.redirect('/');
})

// @route GET /files
// @desc Display all files in JSON
app.get('/files', (req, res)=>{
    gfs.files.find().toArray((err, files)=>{
        //Check if files
        if(!files || files.length === 0){
            return res.status(404).json({err:'No files exists'});
        }

        //Files exists
        return res.json({files});
    });
});

const port = 3500;

app.listen(port, () => console.log(`Server started on port ${port}`));
