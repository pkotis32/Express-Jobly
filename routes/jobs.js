"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const {ensureAdmin} = require('../middleware/auth')
const Job = require("../models/job");

const jobCreateSchema = require('../schemas/jobCreate.json');
const jobSearchSchema = require('../schemas/jobSearch.json')
const jobUpdateSchema = require('../schemas/jobUpdate.json')
const { json } = require("body-parser");

const router = new express.Router();



/**
 * POST / {job} => {job}
 * 
 * job should be {title, salary, equity, companyHandle}
 * 
 * Returns {id, title, salary, equity, companyHandle}
 * 
 * authorization required admin
 */


router.post('', ensureAdmin, async (req, res, next) => {
    try {
        let validator = jsonschema.validate(req.body, jobCreateSchema)
        if (!validator.valid) {
            let errs = validator.errors.map((e) => e.stack)
            throw new BadRequestError(errs)
        }

        let newJob = await Job.create(req.body)
        return res.status(201).json({job: newJob})
    } catch (error) {
        return next(error)
    }
    
})

/**
 * GET / => {jobs: {id, title, salary, equity, companyHandle, companyName}}
 * 
 * optional filtering parameters : (title (case insensitive search), minEmployees, equity (will find whether job has equity or oot))
 * 
 * autorization: noner
 */


router.get('', async (req, res, next) => {
    
    let query = req.query

    if (query.minEmployees !== undefined) {
        query.minEmployees = +query.minEmployees
    }

    try {
        let validator = jsonschema.validate(query, jobSearchSchema)
        if (!validator.valid) {
            let errs = validator.errors.map((e) => e.stack)
            throw new BadRequestError(errs)
        }

        const jobs = await Job.find_all(query)
        res.json({jobs})
        
    } catch (error) {
       return next(error) 
    }
})



/**
 * GET /[id] => {job}
 * 
 * Returns {id, title, salary, equity, company: {handle, name, numEmployees, description, logoUrl}}
 * 
 * authorization: none
 */

router.get('/:id', async (req, res, next) => {

    try {
        const {id} = req.params

        let job = await Job.get(id)

        return res.json({job})
    } catch (error) {
        return next(error)
    }
    
})



/**
 * PATCH /[id] {field1, field2, ...}=> {job: {id, title, salary, equity, companyHandle}}
 * 
 * can pass in optional fields to update: title, salary, equity, companyHandle
 * 
 * authorization: admin
 * 
 */


router.patch('/:id', ensureAdmin, async (req, res, next) => {

    const {id} = req.params
    try {
        let validator = jsonschema.validate(req.body, jobUpdateSchema)
        if (!validator.valid) {
            let errs = validator.errors.map((e) => e.stack)
            throw new BadRequestError(errs)
        }

        let job = await Job.update(id, req.body)
        return res.json({job})
    } catch (error) {
        return next(error)
    }

})


/**
 * DELETE /[id] => {job: {id}}
 * 
 * authorization: admin
 */


router.delete('/:id', ensureAdmin, async (req, res, next) => {

    try {
        const {id} = req.params
        const job = await Job.remove(id)
        return res.json({deleted: +req.params.id})
    } catch (error) {
        return next(error)
    }
})


module.exports = router