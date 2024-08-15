const {sqlForPartialUpdate} = require('./sql')


describe('sqlForPartialUpdate', function() {
    test('throws an error when no data is provided', function() {
      expect(() => {
        sqlForPartialUpdate({}, {firstName: 'first_name' });
      }).toThrow('No data');
      expect(sqlForPartialUpdate({firstName: 'Aliya', age: 32}, {firstName: 'first_name' }))
      .toEqual({
        'setCols': `"first_name"=$1, "age"=$2`,
        'values': ['Aliya', 32]
      })
      
    })
})
