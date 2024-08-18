"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


// related functions for jobs
class Job {

    /* create job from (data), adds job to database and returns job info
    * 
    * data should be {title, salary, equity, companyHandle}
    * 
    * should return {id, title, salary, equity, companyHandle}
    * */

    static async create({title, salary, equity, companyHandle}) {

        const result = await db.query(`INSERT INTO jobs (title,
                                                   salary,
                                                   equity,
                                                   company_handle)
                                 VALUES ($1, $2, $3, $4)
                                 RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
                                [title, salary, equity, companyHandle])
        
        let job = result.rows[0]
        return job
    }


    static async find_all(q = {}) {

        const {title, minSalary, equity} = q

        let query = (`SELECT j.id, 
                            j.title, 
                            j.salary, 
                            j.equity, 
                            j.company_handle AS "companyHandle",
                            c.name AS "companyName"
                    FROM jobs AS j
                    LEFT JOIN companies AS c ON j.company_handle = c.handle`)
        
        let whereExpressions = []
        let values = []

        if (title !== undefined) {
            values.push(`%${title}%`)
            let exp = `title ILIKE $${values.length}`
            whereExpressions.push(exp)
        }
        if (minSalary !== undefined) {
            values.push(minSalary)
            let exp = `salary >= $${values.length}`
            whereExpressions.push(exp)
        }
        if (equity) {
            let exp =  `equity > 0`
            whereExpressions.push(exp)
        }

        if (whereExpressions.length > 0) {
            query += ' WHERE ' + whereExpressions.join(' AND ') + ' ORDER BY title'
        }

        const result = await db.query(query, values)
        
        let jobs = result.rows
        return jobs
    }

    /* get job by id 
    *
    * should return {id, title, salary, equity, company
    * 
    * should throw NotFoundError if job is not found*/
   

    static async get(id) {

        const result = await db.query(`SELECT j.id, 
                                              j.title, 
                                              j.salary, 
                                              j.equity, 
                                              j.company_handle AS "companyHandle",
                                              c.name AS "companyName",
                                              c.handle AS "companyHandle",
                                              c.num_employees AS "numEmployees",
                                              c.description,
                                              c.logo_url AS "logoUrl"
                                        FROM jobs AS j
                                        LEFT JOIN companies AS c ON j.company_handle = c.handle
                                        WHERE id = $1`, [id])

        let row = result.rows[0]

        if (!row) {
            throw new NotFoundError(`Could't find job with id: ${id}` )
        }

        let job = {
            id: row.id,
            title: row.title,
            salary: row.salary,
            equity: row.equity,
            company: {
                handle: row.companyHandle,
                name: row.companyName,
                numEmployees: row.numEmployees,
                description: row.description,
                logoUrl: row.logoUrl
            }
        }

        return job
    }


    /**
     * update job information
     * 
     * data can contain {title, salary, equity, companyHandle}
     * 
     * should return {id, title, salary, equity, companyHandle}
     * 
     * should throw NotFoundError if job is not found
     */
    static async update(id, data) {

        const {setCols, values} = sqlForPartialUpdate(
            data, 
            {
                companyHandle: 'company_handle'
            })
        
        const result = await db.query(`UPDATE jobs 
                                SET ${setCols}
                                WHERE id = $${values.length + 1}
                                RETURNING id,
                                          title,
                                          salary,
                                          equity,
                                          company_handle AS "companyHandle"`, [...values, id])
        

        if (!result.rows[0]) {
            throw new NotFoundError(`Couldn't find job with id: ${id}`)
        }
        return result.rows[0]
    }

    /**
     * remove a job from the database
     * 
     * param should be the job id
     * 
     * should return the id of the deleted job,
     * 
     * should throw NotFoundError if job could not be found
     */

    static async remove(id) {

        const result = await db.query('DELETE FROM jobs WHERE id = $1 RETURNING id', [id])
        let job = result.rows[0]

        if (!job) {
            throw new NotFoundError(`Couldn't find job with id: ${id}`)
        }
    }
    
}


module.exports = Job