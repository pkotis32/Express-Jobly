"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2AdminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


describe('POST /jobs', function() {
    const newJob = {
      title: 'quant',
      salary: 200000,
      equity: 0.05,
      companyHandle: 'c1'
    }
  
    test('ok for admin', async function() {

      const resp = await request(app)
                              .post('/jobs')
                              .send(newJob)
                              .set('authorization', `Bearer ${u2AdminToken}`)

      expect(resp.statusCode).toEqual(201)
      expect(resp.body).toEqual({job: {...newJob, equity: '0.05', id: expect.any(Number)}})
    })

    test('unauthorized for non admin', async function() {

      const resp = await request(app)
                            .post('/jobs')
                            .send(newJob)
                            .set('authorization', `Bearer ${u1Token}`)
      expect(resp.statusCode).toEqual(401)
    })

    test('bad request with missing data', async function() {

      const resp = await request(app)
                            .post('/jobs')
                            .send({title: 'banker'})
                            .set('authorization', `Bearer ${u2AdminToken}`)

      expect(resp.statusCode).toEqual(400)
    })

    test('bad request with invalid data', async function() {

      const resp = await request(app)
                            .post('/jobs')
                            .send({
                              title: 100,
                              salary: 5,
                              equity: 0.3,
                              companyHandle: 'c3'
                            })
                            .set('authorization', `Bearer ${u2AdminToken}`)

      expect(resp.statusCode).toEqual(400)
    })
})


describe('GET /jobs', function() {
  test('works ok for anonymous user', async function() {

    const resp = await request(app).get('/jobs')
    expect(resp.statusCode).toEqual(200)
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: 'dentist',
          salary: 150000,
          equity: '0.5',
          companyHandle: 'c1',
          companyName: 'C1'
        },
        {
          id: expect.any(Number),
          title: 'programmer', 
          salary: 100000, 
          equity: '0.2',
          companyHandle: 'c2',
          companyName: 'C2'
        },
        {
          id: expect.any(Number),
          title: 'marketer',
          salary: 80000,
          equity: '0',
          companyHandle: 'c3',
          companyName: 'C3'
        }
      ]
    })
  })
})



describe('GET /jobs/:id', function() {
  test('works fo anonymous user', async function() {

    const resp = await request(app).get('/jobs/1')
    expect(resp.statusCode).toEqual(200)
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: 'dentist',
        salary: 150000,
        equity: '0.5',
        company: expect.objectContaining({
          numEmployees: 1
        })
      }
      
    })
  })


  test('job not found', async function() {

    const resp = await request(app).get('/jobs/100')
    expect(resp.statusCode).toEqual(404)

  })
})



describe('PATCH /jobs/:id', function() {
  test('works for admin user', async function() {
    
    let updateData = {title: 'carpenter', salary: 60000, equity: 1, companyHandle: 'c3'}
    const resp = await request(app).patch('/jobs/1')
                                    .send(updateData)
                                    .set('authorization', `Bearer ${u2AdminToken}`)
    expect(resp.statusCode).toEqual(200)
    expect(resp.body).toEqual({job: {
      id: 1,
      title: 'carpenter',
      salary: 60000,
      equity: '1',
      companyHandle: 'c3'
    }})
  })

  test('unauthorized for nonAdmin', async function() {

    let updateData = {title: 'carpenter', salary: 60000, equity: 1, companyHandle: 'c3'}
    const resp = await request(app).patch('/jobs/1')
                                    .send(updateData)
                                    .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('bad request with invalid data', async function() {
    
    let updateData = {title: 100, salary: 60000, equity: 1, companyHandle: 'c3'}
    const resp = await request(app).patch('/jobs/1')
                                    .send(updateData)
                                    .set('authorization', `Bearer ${u2AdminToken}`)
    expect(resp.statusCode).toEqual(400)
  })
})



describe('DELETE /jobs/:id', function() {
  test('works for admin user', async function() {

    const resp = await request(app).delete('/jobs/1').set('authorization', `Bearer ${u2AdminToken}`)
    expect(resp.statusCode).toEqual(200)
    expect(resp.body).toEqual({
      deleted: 1
    })
  })

  test('unauthorized for non admin', async function() {

    const resp = await request(app).delete('/jobs/1').set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('job not found', async function() {

    const resp = await request(app).delete('/jobs/100').set('authorization', `Bearer ${u2AdminToken}`)
    expect(resp.statusCode).toEqual(404)
  })
})