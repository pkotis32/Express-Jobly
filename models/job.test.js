"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


describe('create', function() {
    test('works', async function() {
        let newJob = {
            title: 'banker',
            salary: 90000, 
            equity: '0.01',
            companyHandle: 'c1'
        }

        const job = await Job.create(newJob)
        expect(job).toEqual({...newJob, id: expect.any(Number)})
    })
})


describe('find_all', function() {
    test('works no filter', async function() {
        const jobs = await Job.find_all()
        expect(jobs).toEqual([
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
                salary: 120000,
                equity: '0.2',
                companyHandle: 'c2',
                companyName: 'C2'    
            },
            {   
                id: expect.any(Number),
                title: 'marketer',
                salary: 70000,
                equity: '0',
                companyHandle: 'c3',
                companyName: 'C3'
            }
        ])
    })

    test('works filter:title', async function() {

        const jobs = await Job.find_all({title: 'dentist'})
        expect(jobs).toEqual([{
            id: 1,
            title: 'dentist',
            salary: 150000,
            equity: '0.5',
            companyHandle: 'c1',
            companyName: 'C1'
        }])
    })

    test('works filter:minSalary', async function() {

        const jobs = await Job.find_all({minSalary: 130000})
        expect(jobs).toEqual([{
            id:1,
            title: 'dentist',
            salary: 150000,
            equity: '0.5',
            companyHandle: 'c1',
            companyName: 'C1'
        }])
    })

    test('works filter:equity', async function() {

        const jobs = await Job.find_all({equity: true})
        expect(jobs).toEqual([
            {
                id: 1,
                title: 'dentist',
                salary: 150000,
                equity: '0.5',
                companyHandle: 'c1',
                companyName: 'C1'
            }, 
            {
                id:2,
                title: 'programmer',
                salary: 120000,
                equity: '0.2',
                companyHandle: 'c2',
                companyName: 'C2'
            }])
    })

})



describe('get', function() {
    test('works', async function() {
        const job = await Job.get(1)
        
        expect(job).toEqual({
            id: expect.any(Number),
            title: 'dentist',
            salary: 150000,
            equity: '0.5', 
            company: {
                handle: 'c1',
                name: 'C1',
                numEmployees: 1,
                description: 'Desc1',
                logoUrl: 'http://c1.img'
            }
        })
    })

    test('invalid job', async function() {
        try {
            const job = await Job.get(5)
        } catch (error) {
            expect(error instanceof NotFoundError).toBeTruthy()
        }
        
    })
})



describe('update', function() {
    test('works', async function() {

        let data = {
            title: 'carpenter', 
            salary: 60000,
            equity: '1',
            company_handle: 'c2'
        }           
        

        const resp = await Job.update(1, data)

        expect(resp).toEqual({
            id: expect.any(Number),
            title: 'carpenter',
            salary: 60000,
            equity: '1',
            companyHandle: 'c2'
        })

    })

    test('invalid job', async function() {
        try {
            let data = {
                title: 'carpenter', 
                salary: 60000,
                equity: '1',
                company_handle: 'c2'
            }  
            const job = await Job.update(5, data)
        } catch (error) {
            expect(error instanceof NotFoundError).toBeTruthy()
        }
        
    })
})



describe('remove', function() {

    test('works', async function() {

        await Job.remove(1)
        const result = await db.query('SELECT * FROM jobs WHERE id = $1', [1])
        expect(result.rows.length).toEqual(0)
    })

    test('invalid job', async function() {
        try {
            await Job.remove(5)
        } catch (error) {
            expect(error instanceof NotFoundError).toBeTruthy()
        }
        
    })

})