/*
 * Copyright (c) 2014-2020 Bjoern Kimminich.
 * SPDX-License-Identifier: MIT
 */

const utils = require('../lib/utils')
const insecurity = require('../lib/insecurity')
const models = require('../models/index')
const challenges = require('../data/datacache').challenges

module.exports = function retrieveBasket () {
  return (req, res, next) => {
    const id = req.params.id
    models.Basket.findOne({ where: { id }, include: [{ model: models.Product, paranoid: false }] })
      .then(basket => {
        /* jshint eqeqeq:false */
        const user = insecurity.authenticatedUsers.from(req)
        if (user.bid == id) {
          utils.solveIf(challenges.basketAccessChallenge, () => {
            return user && id && id !== 'undefined' && id !== 'null' && user.bid != id // eslint-disable-line eqeqeq
          })
          if (basket && basket.Products && basket.Products.length > 0) {
            for (let i = 0; i < basket.Products.length; i++) {
              basket.Products[i].name = req.__(basket.Products[i].name)
            }
          }
          res.json(utils.queryResultToJson(basket))
        } else {
          res.status(403).json({
            status: 'Forbidden',
            data: {
              message: "You are trying to get not your basket!"
            }
          })
        }
      }).catch(error => {
        next(error)
      })
  }
}
