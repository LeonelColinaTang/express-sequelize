// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Student } = require('../db/models');
const { Op, Sequelize } = require("sequelize");

// List
router.get('/', async (req, res, next) => {
  let errorResult = { errors: [], count: 0, pageCount: 0 };

  let page = req.query.page;

  if (page === "0") {
    page = null;
  } else if (page === undefined) {
    page = 1;
  } else {
    page = parseInt(page);
  }

  let size = req.query.size;

  if (size === "0") {
    size = null;
  } else if (size === undefined) {
    size = 10;
  } else {
    size = parseInt(size);
  }

  //If the parameters are invalid, populate the errorResult object
  if (String(size) === "NaN" || String(page) === "NaN") {
    errorResult.errors.push({ message: "Requires valid page and size params" });
  }

  const where = {};

//   firstName filter:
  if(req.query.firstName){
      where.firstName = {[Op.substring]: req.query.firstName}
  }

//   lastName filter:
  if(req.query.lastName){
    where.lastName = { [Op.substring]: req.query.lastName};
  }

//   leftHanded filter:
  if(req.query.leftHanded === 'true'){
    where.leftHanded = { [Op.eq]: true };
  } else if(req.query.leftHanded === 'false'){
    where.leftHanded = {[Op.eq]: false}
  }else if(req.query.leftHanded !== undefined){
    errorResult.errors.push({message: 'Lefty should be either true or false'})
  }

  let result = {};
  // Calculate the offset
  const offset = size * (page - 1);

  // Query and calculate the total of students and add it to the error
  let total = await Student.findAll({
    attributes: {
      include: [
        [Sequelize.fn("COUNT", Sequelize.col("leftHanded")), "total"],
        "id",
        "firstName",
        "lastName",
        "leftHanded",
      ],
    },
    where,
    order: [["lastName"], ["firstName"]],
  });
  total = total[0].dataValues.total;

  //Calculate the number of pages
  const pageCount = Math.ceil(total / size);

  if (errorResult.errors.length > 0) {
    errorResult.count = total;
    res.statusCode = 400;
    res.send(errorResult);
  }

  // Add all the values to the result object
  result.rows = await Student.findAll({
    attributes: ["id", "firstName", "lastName", "leftHanded"],
    where,
    order: [["lastName"], ["firstName"]],
    limit: size,
    offset,
  });
  result.page = page || 1;
  result.count = total;
  result.pageCount = pageCount;

  res.json(result);
});

// Export class - DO NOT MODIFY
module.exports = router;