const express = require('express');
const routerApiV1 = require('./api/v1/router-api-v1');

const api = express.Router()

api.use('/v1', routerApiV1)

module.exports = api;