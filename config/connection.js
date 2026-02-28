

const mongoClient = require('mongodb').MongoClient;
const state = {
    db: null
};

module.exports.connect = async function (done) {
    const url = process.env.MONGO_URL;
    const dbname = 'shopping';

    try {
        const data = await mongoClient.connect(url);
        state.db = data.db(dbname);
        done();
    } catch (err) {
        done(err);
    }
};

module.exports.get = function () {
    return state.db;
};














/* const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect= function(done){
    const url='mongodb://localhost:27017'
    const dbname='shopping'


    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
            state.db=data.db(dbname)
        done()
    })
    
}


module.exports.get=function(){
    return state.db
}
 */
/* 
var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient


router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


router.post('/submit', function (req, res) {
  console.log(req.body)

  MongoClient.connect("mongodb://localhost:27017", function (err, client) {

    if (err)
      console.log('error')
    else
     client.db('Home').collection('user').insertOne(req.body)
  })

  res.send("Account Created")

})


module.exports = router;
 */
/* 

var MongoClient = require('mongodb').MongoClient
const url = "mongodb://127.0.0.1:27017";



  try {
    const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
    const db = client.db('Home');
    await db.collection('User').insertOne(req.body);

    console.log('Data saved successfully')
    client.close();

    res.send("Account Created")

  }
  catch (err) {

    console.error('Database Error : ', err)
    res.status(500).send("Failed to save Data")

  }
 */

