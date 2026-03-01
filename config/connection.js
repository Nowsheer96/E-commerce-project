

const mongoClient = require('mongodb').MongoClient;
const state = {
    db: null
};

module.exports.connect = async function (done) {
   const url = process.env.MONGO_URL;

  //const url = 'mongodb://localhost:27017/'
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



const connect = async (cb) => {
    console.log("Attempting to connect to:", process.env.MONGO_URL); // This will show in Render logs
    // ... your connection code
}



