/**
 * @file shipment-status-repository.js
 * @description Database access layer for shipment status records.
 *
 * Exports:
 *  - getShipmentStatusByCode — fetch single shipment status record by code
 */

'use strict';

const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {

} = require('./queries/shipment-status-queries');


module.exports = {

};
