"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require('../models/job.js')
const { createToken } = require("../helpers/tokens");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  await db.query('DELETE FROM jobs')
  await db.query('DELETE FROM applications')

  await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");

  await Company.create(
      {
        handle: "c1",
        name: "C1",
        numEmployees: 1,
        description: "Desc1",
        logoUrl: "http://c1.img",
      });
  await Company.create(
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      });
  await Company.create(
      {
        handle: "c3",
        name: "C3",
        numEmployees: 3,
        description: "Desc3",
        logoUrl: "http://c3.img",
      });
  await Company.create(
    {
      handle: 'c4', 
      name: 'C4',
      numEmployees: 4,
      description: 'desc4',
      logoUrl: "http://c4.img"
    })

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });
  await Job.create({
    title: 'dentist',
    salary: 150000,
    equity: 0.5,
    companyHandle: 'c1'
  })
  await Job.create({
    title: 'programmer', 
    salary: 100000, 
    equity: 0.2,
    companyHandle: 'c2'
  })
  await Job.create({
    title: 'marketer',
    salary: 80000,
    equity: 0,
    companyHandle: 'c3'
  })
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1", isAdmin: false });
const u2AdminToken = createToken({username: 'admin', isAdmin: true})


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2AdminToken
};
