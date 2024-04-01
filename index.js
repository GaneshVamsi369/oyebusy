const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const app = express();
const port = 3000;

app.use(express.json()); 

const dbHost = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const uri = `mongodb+srv://${dbHost}:${dbPassword}@cluster0.a9ff9ol.mongodb.net/${process.env.DB_DATABASE}`;

// Connect to MongoDB
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect()
  .then(() => console.log("Connected to MongoDB"))
  .catch(console.error);
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

// Get all Movies
app.get('/get-all', async (req, res) => {
  try {
    const db = client.db(process.env.DB_DATABASE);
    const moviesCollection = db.collection('movies');
    const movies = await moviesCollection.find({}).toArray();
    res.status(200).json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single Movie    
app.get('/get-single', async (req, res) => {
  try {
    const { id } = req.query; // Request parameter for ID comes from query string (?id=...)
    const db = client.db(process.env.DB_DATABASE);
    const moviesCollection = db.collection('movies');
    const movie = await moviesCollection.findOne({ _id: new ObjectId(id) });

    if (!movie) {
      return res.status(404).json({ message: `Movie with ID ${id} not found` });
    }

    res.status(200).json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /get-paginated?page={page}&size={size}
app.get('/get-paginated', async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query; 
    if (isNaN(page) || parseInt(page) < 1 || isNaN(size) || parseInt(size) < 1) {
      return res.status(400).json({ message: 'Invalid page or size parameter' });
    }

    const db = client.db(process.env.DB_DATABASE);
    const moviesCollection = db.collection('movies');
    const skip = (parseInt(page) - 1) * parseInt(size);
    const movies = await moviesCollection.find().skip(skip).limit(parseInt(size)).toArray();
    const totalDocuments = await moviesCollection.countDocuments();

    const response = {
      data: movies,
      currentPage: parseInt(page),
      pageSize: parseInt(size),
      totalPages: Math.ceil(totalDocuments / parseInt(size)),
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Add new Movie
app.post('/add-movie', async (req, res) => {
  try {
    const db = client.db(process.env.DB_DATABASE);
    const moviesCollection = db.collection('movies');
    await moviesCollection.insertOne(req.body);
    res.status(201).json(req.body); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



