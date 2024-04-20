const express = require('express');
const mysql = require('mysql');
const os = require('os');

const app = express();
  
// Database configuration
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE    
});

// Connect to the database
connection.connect(function(err) {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
});

// Route to get all books from the database
app.get('/api/books', function(req, res) {
  const query = 'SELECT * FROM books';
  connection.query(query, function(err, results) {
    if (err) {
      console.error('Error querying database:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json(results);
  });
});

// Route to get a single book by ID from the database
app.get('/api/books/:id', function(req, res) {
  const id = req.params.id;
  const query = 'SELECT * FROM books WHERE id = ?';
  connection.query(query, [id], function(err, results) {
    if (err) {
      console.error('Error querying database:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (results.length === 0) {
      res.status(404).send('Book not found');
      return;
    }
    res.json(results[0]);
  });
});

// Route to record the hostname
app.get('/api/stats', (req, res) => {
  const hostname = os.hostname();
  res.json({ hostname });
});

// use port 80808 
const PORT = process.env.PORT || 8080;
app.listen(PORT, function() {
  console.log(`Server is running on port ${PORT}`);
});
