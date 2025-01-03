/**
 * @file middleware.js
 * @description Centralized middleware configuration for the application.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const applyGlobalMiddleware = (app) => {
  // Express built-in middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Third-party middleware
  app.use(cors());
  app.use(helmet());
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
};

module.exports = applyGlobalMiddleware;
