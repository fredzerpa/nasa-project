const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const api = require('./routes/api');

const app = express();

app.use(
  cors({
    origin: `http://localhost:3000`,
  })
);

app.use(morgan('combined'));

app.use(express.json());

// Serve the client static files
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', api);

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = app;
