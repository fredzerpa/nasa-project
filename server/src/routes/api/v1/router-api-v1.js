const express = require('express');

const launchesRouter = require('./launches/launches.router');
const planetsRouter = require('./planets/planets.router');

const routerApiV1 = express.Router();

routerApiV1.use('/planets', planetsRouter);
routerApiV1.use('/launches', launchesRouter);

module.exports = routerApiV1;