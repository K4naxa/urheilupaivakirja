var express = require("express");
var router = express.Router();

const knex = require("../../utils/dbConnection");


router.post("/database_reset", async (req, res) => {
  try {

    await knex.migrate.rollback(null, true);
    await knex.migrate.latest();
    await knex.seed.run();

    res.status(200).json({ message: "Database reseted successfully!" });
    console.log("Database reset!");
  } catch (error) {
    console.error("Error reseting database:", error);
    res
      .status(500)
      .json({ message: "Error reseting database", error: error.message });
  }
});

module.exports = router;