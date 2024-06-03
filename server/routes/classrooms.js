// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Classroom, Supply, StudentClassroom } = require('../db/models');
const { Op, Sequelize } = require('sequelize');
const studentclassroom = require('../db/models/studentclassroom');

// List of classrooms
router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    // Phase 6B: Classroom Search Filters

    const where = {};

    // name filter:      
    if(req.query.name){
        where.name = {[Op.substring] : req.query.name}
    }


    let limit = req.query.studentLimit;
    if(limit){
        limit = limit.split(",");
        console.log("LIMIT", parseInt(limit[0]))
        if(limit.length === 2 && Number(limit[0]) > Number(limit[1])){
            console.log("HIT")
            errorResult.errors.push({message: 'Student Limit should be two numbers: min, max'})
        }else if(limit.length === 2 && limit[0] < limit[1]){
            //WHERE limit BETWEEN min AND max
            console.log("Souldn't be hit")
            where.studentLimit = {[Op.between]: [limit[0],limit[1]]}
        }else if(limit.length === 1){
            //WHERE limit == limit
            where.studentLimit = {[Op.eq] : limit[0]}
        }
    }

    if(errorResult.errors.length > 0){
        res.send(errorResult)
    }

    const classrooms = await Classroom.findAll({
        attributes: [ 'id', 'name', 'studentLimit' ],
        where,
        order: [['name']]
    });

    res.json(classrooms);
});

// Single classroom
router.get('/:id', async (req, res, next) => {
    let classroom = await Classroom.findByPk(req.params.id, {
        attributes: ['id', 'name', 'studentLimit'],
        // Phase 7:
            // Include classroom supplies and order supplies by category then
                // name (both in ascending order)
            // Include students of the classroom and order students by lastName
                // then firstName (both in ascending order)
                // (Optional): No need to include the StudentClassrooms
        // Your code here
    });

    if (!classroom) {
        res.status(404);
        res.send({ message: 'Classroom Not Found' });
    }

    classroom.toJSON();

    // classroom.dataValues.supplyCount = await Supply.findAll({attributes:{
    //     include: [[Sequelize.fn("COUNT", Sequelize.col("id")),"supplyCount"]]
    // }, where:{
    //     classroomId: req.params.id
    // }}).then(res => res[0].dataValues.supplyCount);
    // console.log("CLASSROOM2", classroom);


    classroom.dataValues.supplyCount = await Supply.count({
        where:{
            classroomId: req.params.id
        }
    })

    classroom.dataValues.studentCount = await StudentClassroom.count({
        where: {
            classroomId: req.params.id
        }
    })

    classroom.dataValues.avgGrade = await StudentClassroom.sum('grade',{
        where:{
            classroomId: req.params.id
        }
    })/classroom.dataValues.studentCount;

    classroom.dataValues.overloaded = classroom.dataValues.studentCount > classroom.dataValues.studentLimit
    
    res.send(classroom);
});

// Export class - DO NOT MODIFY
module.exports = router;