const http = require('http');
require('dotenv').config(); // To use .env variables on the Tests

const app = require('./app');
const { loadLaunchesData } = require('./models/launches/launches.model');
const { loadPlanetsData } = require('./models/planets/planets.model');
const { mongoConnect } = require('./services/mongo');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

async function startServer() {
  await mongoConnect();
  await loadPlanetsData();
  await loadLaunchesData();
  server.listen(PORT, console.log(`Listening on PORT ${PORT}...`));
}

startServer();
