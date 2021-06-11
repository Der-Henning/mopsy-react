"use strict";

const router = require("express").Router();
const sequelize = require("sequelize");
const errors = require("../../../middleware/errors");
const searchRouter = require("./search");
const userRouter = require("./user");
const favoriteRouter = require("./favorite");
const crawlerRouter = require("./crawler");
const pdfRouter = require("./pdf");
const changesRouter = require("./changes");

router.get("/", function(req, res, next) {
  res.status(200).send("Welcome to MOPS-Y API!");
});

router.use("/search", searchRouter);
router.use("/user", userRouter);
router.use("/favorite", favoriteRouter);
router.use("/crawler", crawlerRouter);
router.use("/pdf", pdfRouter);
router.use("/changes", changesRouter);

router.use((err, req, res, next) => {
  console.log(err);
  if (err instanceof sequelize.ConnectionRefusedError)
    res.status(500).send(errors.error(20, "Database offline"));
  else if (err instanceof errors.MissingParameterError)
    res.status(400).send(errors.error(10, "Missing Parameter(s)"));
  else if (err instanceof errors.ResourceNotFoundError)
    res
      .status(400)
      .send(errors.error(11, err.data.resource + " does not exist"));
  else if (err instanceof errors.AuthenticationError)
    res.status(400).send(errors.error(12, "Authentication Failed"));
  else if (err instanceof errors.UnauthorizedError)
    res.status(400).send(errors.error(13, "No Access"));
  else if (err instanceof sequelize.UniqueConstraintError)
    res.status(400).send(errors.error(14, err.errors[0].message));
  else if (err instanceof sequelize.ValidationError)
    res.status(400).send(errors.error(15, err.errors[0].message));
  else if (err instanceof sequelize.ForeignKeyConstraintError)
    res.status(400).send(errors.error(18, "Doesn't exist"));
  else if (err instanceof errors.InvalidTokenError)
    res.status(400).send(errors.error(19, "Invalid Token"));
  else if (err instanceof sequelize.DatabaseError)
    res.status(500).send(errors.error(21, "Database Error"));
  else if (err instanceof errors.SolrBackendError)
    res.status(500).send(errors.error(23, "SOLR Configuration Error"));
  else if (err.code == "ECONNREFUSED")
    res.status(500).send(errors.error(22, "SOLR database offline"));
  else res.status(500).send(errors.error(99, "Internel Server Error"));
});

module.exports = router;
