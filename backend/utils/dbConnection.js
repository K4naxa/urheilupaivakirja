const config = require("./config.js");
const options = config.DATABASE_OPTIONS;
const db = require("knex")(options);

module.exports = db;
