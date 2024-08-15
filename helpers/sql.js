const { BadRequestError } = require("../expressError");


// helps create an sql update query that dynamically creates the set statement and prepares the values
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  
  // extract the values of column names that want to be updated
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  // obtains the sql column name from the jsToSql object, and then increments the placeholder to accurately create the set statement in an sql query
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // the setCols property contains the set statement, and the values obtains all the updated values
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
