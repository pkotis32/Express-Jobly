"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * 
   * can add option query parameters: {q, minEmployees, maxEmployees}
   * */

  static async findAll(q = {}) {

    // starting template for query 
    let query = 
      `SELECT 
          handle,
          name,
          description,
          num_employees AS "numEmployees",
          logo_url AS "logoUrl"
      FROM companies`

    let whereExpression = []
    let values = []
    
    // extract query params
    let name = q.q
    let minEmployees = q.minEmployees
    let maxEmployees = q.maxEmployees

    // throw error if min employees is greater than max employees
    if (minEmployees > maxEmployees) {
      throw new BadRequestError('min cannot be greater than max employees')
    }

    // if minEmployess exists, add its value and query 
    if (minEmployees !== undefined) {
      values.push(minEmployees)
      let exp = `num_employees >= $${values.length}`
      whereExpression.push(exp)
    }
    // if maxEmployees exists, and its value and query
    if (maxEmployees !== undefined) {
      values.push(maxEmployees)
      let exp = `num_employees <= $${values.length}`
      whereExpression.push(exp) 
    }
    // if name exists, add its query and value
    if (name !== undefined) {
      values.push(`%${name}%`)
      let exp =  `name ILIKE $${values.length}`
      whereExpression.push(exp)
    }

    // complete the query by adding full where clause and adding order by at the end
    if (whereExpression.length > 0) {
      query += ' WHERE ' + whereExpression.join(' AND ') + ' ORDER BY name'
    }

    // execute query
    const result = await db.query(query, values)

    let companies = result.rows
    return companies


  
  }




  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl",
                  j.id,
                  j.title,
                  j.salary,
                  j.equity,
                  j.company_handle AS "companyHandle"
           FROM companies AS c
           LEFT JOIN jobs AS j ON c.handle = j.company_handle
           WHERE handle = $1`,
        [handle]);

    if (!companyRes.rows[0]) throw new NotFoundError(`No company: ${handle}`);

    const {name, description, numEmployees, logoUrl} = companyRes.rows[0]
    
    let jobs = companyRes.rows.map(r => {
      if (r.id === null) {
        return 
      }
      return {
        id: r.id,
        title: r.title,
        salary: r.salary,
        equity: r.equity,
        companyHandle: r.companyHandle
      }
    })
    
    if (jobs[0] === undefined) {
      jobs = []
    }

    let company = {handle, name, description, numEmployees, logoUrl, jobs}
    return company
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }



}




module.exports = Company;
