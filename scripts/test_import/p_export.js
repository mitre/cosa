const Promise = require("bluebird")
const parse = require('csv-parse/lib/sync')
const fs = require('fs')
const mysql = require('promise-mysql')
var config = require('../../config');
//Creating the CSV writer
const createCsvWriter = require('csv-writer').createObjectCsvWriter;  
const csvWriter = createCsvWriter({  
  path: 'cosa_data.csv',
  
  header: [
    {id: 'SECURITY_CONTROL_NAME', title: 'control'},
    {id: 'APPLICABLE', title: 'applicable'},
    {id: 'CONTROL_ITEM', title: 'name'},
    {id: 'DESCRIPTION', title: 'description'},
    {id: 'AUTO_EVIDENCE', title: 'auto_evidence'},
    {id: 'GATHERED_EVIDENCE', title: 'gathered_evidence'},
    {id: 'FREQUENCY', title: 'frequency'},
    {id: 'DEPENDS_ON_TEST', title: 'depends_On'},
    {id: 'RUNTIME_CHECK', title: 'runtime_check'} ,
  ]
});

var system_name = process.argv[2]
var sql = `SELECT system.NAME as SYSTEM_NAME, security_control.NAME as SECURITY_CONTROL_NAME, 
system_roles_default.NAME as SYSTEM_ROLE_NAME,
system_control_test_procedure_types_default.NAME as system_control_test_procedure_types,

system_control_test.CONTROL_ITEM,
system_control_test.TITLE,
system_control_test.DESCRIPTION,
system_control_test.FREQUENCY,
system_control_test.AUTO_EVIDENCE,
system_control_test.GATHERED_EVIDENCE,
system_control_test.RUNTIME_CHECK,
CASE WHEN system_control_test.APPLICABLE  = '0' THEN 'N' ELSE 'Y'  END as APPLICABLE,
b.NAME AS DEPENDS_ON_TEST


FROM system_control_test

INNER JOIN system ON system.PK_SYSTEM_ID = system_control_test.FK_SYSTEM_ID
INNER JOIN security_control ON security_control.PK_SECURITY_CONTROL_ID = system_control_test.FK_SECURITY_CONTROL_ID
INNER JOIN system_control_test_procedure_types_default ON ssystem_control_test_procedure_types_default.PK_SYSTEM_CONTROL_TEST_PROCEDURE_TYPE_ID = system_control_test.FK_SYSTEM_CONTROL_TEST_PROCEDURE_TYPE_ID
INNER JOIN system_roles_default ON system_roles_default.PK_ROLE_ID = system_control_test.FK_ROLE_ID
INNER JOIN system AS b ON b.PK_SYSTEM_ID = system_control_test.DEPENDS_ON_SYSTEM_ID

WHERE system.NAME=?`
;

mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database

}).then(conn => {
    connection=conn
    //console.log('connected as id ' + connection.threadId);

    sql = mysql.format(sql,[system_name]);
    return connection.query(sql);
    

}).then( (data)=> {
    csvWriter  
  .writeRecords(data)
  .then(()=>{
connection.end()
  console.log('The CSV file was written successfully')
}
);

}).catch((err)=>{
    console.error('error:' + err.stack);
    connection.end()
})