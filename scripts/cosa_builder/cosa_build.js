const Promise = require("bluebird")
const parse = require('csv-parse/lib/sync')
const fs = require('fs')
const mysql = require('promise-mysql')
var config = require('../../config');
//Creating the CSV writer
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

if (!fs.existsSync('./reports')) {
    fs.mkdirSync('./reports');
}
if (!fs.existsSync('reports/cosa')) {
    fs.mkdirSync('reports/cosa');
}

module.exports = function (system_name, include_satisfied, callback) {
    var d = new Date();
    var datestring = d.getFullYear() + ("0"+(d.getMonth()+1)).slice(-2)
    + ("0" + d.getDate()).slice(-2)  + ("0" + d.getHours()).slice(-2)
    + ("0" + d.getMinutes()).slice(-2) + ("0" + d.getSeconds()).slice(-2);

    let filename = system_name.replace(/ /g,"-");
    filename += '_COSA_'+datestring+'.csv'
    let csvWriter = createCsvWriter({
        path: 'reports/cosa/'+ filename,
        header: [
            { id: 'CONTROL_NUMBER', title: 'Control Number' },
            { id: 'FINDING_TITLE', title: 'Finding Title' },
            { id: 'DATE_IDENTIFIED', title: 'Date Identified' },
            { id: 'FINDING_ID', title: 'Finding Id' },
            { id: 'INFORMATION_SYSTEM', title: 'Information System or Program Name' },
            { id: 'REPEAT_FINDINGS', title: 'Repeat Findings' },
            { id: 'REPEAT_FINDING_COSA_WEAKNESS_ID', title: 'Repeat Finding COSA Weakness ID' },
            { id: 'FINDING_DESCRIPTION', title: 'Finding Description' },
            { id: 'WEAKNESS_DESCRIPTION', title: 'Weakness Description' },
            { id: 'CONTROL_WEAKNESS_TYPE', title: 'Control Weakness Type' },
            { id: 'SOURCE', title: 'Source' },
            { id: 'AUDIT_ASSESSMENT_COMPANY', title: 'Assessment/Audit Company' },
            { id: 'TEST_METHOD', title: 'Test Method' },
            { id: 'TEST_OBJECTIVE', title: 'Test Objective' },
            { id: 'TEST_RESULT_DESCRIPTION', title: 'Test Result Description' },
            { id: 'TEST_RESULT', title: 'Test Result' },
            { id: 'RECOMMENDED_CORRECTIVE_ACTIONS', title: 'Recommended Corrective Action(s)' },
            { id: 'EFFECT_ON_BUSINESS', title: 'Effect on Business' },
            { id: 'LIKELIHOOD', title: 'Likelihood' },
            { id: 'IMPACT', title: 'Impact' },
        ]
    });

    let sql = `SELECT security_control.NAME as CONTROL_NUMBER,
    GROUP_CONCAT(DISTINCT work_item_result.FINDING_TITLE ORDER BY work_item_result.FINDING_TITLE ASC separator '; ') AS FINDING_TITLE,
	
    SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT DATE_FORMAT(work_item_result.MODIFIED_DATE,'%m/%d/%Y')  
					ORDER BY work_item_result.MODIFIED_DATE DESC separator ', '), ',' , 1) AS DATE_IDENTIFIED,

                    CONCAT(system.ACRONYM, '; ', DATE_FORMAT(MAX(work_item_result.MODIFIED_DATE),'%m/%d/%Y'), '; ', GROUP_CONCAT(DISTINCT system_control_test.PK_SYSTEM_CONTROL_TEST_ID ORDER BY system_control_test.FK_SECURITY_CONTROL_ID ASC separator '; ')) as FINDING_ID,
	
    CASE
        WHEN  MAX(work_item_result.REPEAT_FINDING) = '0' THEN 'No'
        WHEN  MAX(work_item_result.REPEAT_FINDING) = '1' THEN 'Yes'
        END
    as REPEAT_FINDINGS,
    
    GROUP_CONCAT(DISTINCT work_item_result.REPEAT_FINDING_COSA_WEAKNESS_ID ORDER BY work_item_result.REPEAT_FINDING_COSA_WEAKNESS_ID ASC separator '; ') AS REPEAT_FINDING_COSA_WEAKNESS_ID,

	GROUP_CONCAT(DISTINCT work_item_result.FINDING_DESCRIPTION ORDER BY work_item_result.FINDING_DESCRIPTION ASC separator '; ') AS FINDING_DESCRIPTION,
    
	system.NAME AS INFORMATION_SYSTEM,

	GROUP_CONCAT(DISTINCT work_item_result.WEAKNESS_DESCRIPTION ORDER BY work_item_result.WEAKNESS_DESCRIPTION ASC separator '; ') AS WEAKNESS_DESCRIPTION,
	GROUP_CONCAT(DISTINCT control_weakness_type_default.NAME ORDER BY control_weakness_type_default.NAME ASC separator '; ') AS CONTROL_WEAKNESS_TYPE,
   
	'SCA' as SOURCE,
	'COSA' as AUDIT_ASSESSMENT_COMPANY,

    GROUP_CONCAT(DISTINCT system_control_test_procedure_types_default.NAME ORDER BY system_control_test_procedure_types_default.NAME DESC separator '; ') AS TEST_METHOD,
    GROUP_CONCAT(DISTINCT system_control_test.TEST_OBJECTIVE ORDER BY system_control_test.TEST_OBJECTIVE DESC separator '; ') AS TEST_OBJECTIVE,
  
	GROUP_CONCAT(DISTINCT  work_item_result.RESULT_DESC ORDER BY  work_item_result.RESULT_DESC ASC separator '; ') AS TEST_RESULT_DESCRIPTION,
    
	GROUP_CONCAT(DISTINCT work_item_status_default.NAME ORDER BY work_item_status_default.NAME DESC separator ', ')AS TEST_RESULT,

	GROUP_CONCAT(DISTINCT  work_item_result.RECOMMENDED_CORRECTIVE_ACTIONS ORDER BY  work_item_result.RECOMMENDED_CORRECTIVE_ACTIONS ASC separator '; ') AS RECOMMENDED_CORRECTIVE_ACTIONS,
    GROUP_CONCAT(DISTINCT  work_item_result.EFFECT_ON_BUSINESS ORDER BY  work_item_result.EFFECT_ON_BUSINESS ASC separator '; ') AS EFFECT_ON_BUSINESS,
        
    CASE
        WHEN SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT work_item_result.FK_IMPACT_ID ORDER BY work_item_result.FK_IMPACT_ID DESC separator ', '), ',', 1) LIKE '1' THEN 'Low'
        WHEN SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT work_item_result.FK_IMPACT_ID ORDER BY work_item_result.FK_IMPACT_ID DESC separator ', '), ',', 1) LIKE '2' THEN 'Moderate'
        WHEN SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT work_item_result.FK_IMPACT_ID ORDER BY work_item_result.FK_IMPACT_ID DESC separator ', '), ',', 1) LIKE '3' THEN 'High'        
        END
    as IMPACT,
   
   CASE
        WHEN SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT work_item_result.FK_LIKELIHOOD_ID ORDER BY work_item_result.FK_LIKELIHOOD_ID DESC separator ', '), ',', 1) LIKE '1' THEN 'Low'
        WHEN SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT work_item_result.FK_LIKELIHOOD_ID ORDER BY work_item_result.FK_LIKELIHOOD_ID DESC separator ', '), ',', 1) LIKE '2' THEN 'Moderate'
        WHEN SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT work_item_result.FK_LIKELIHOOD_ID ORDER BY work_item_result.FK_LIKELIHOOD_ID DESC separator ', '), ',', 1) LIKE '3' THEN 'High'        
        END
    as LIKELIHOOD
    
    FROM system_control_test
     JOIN security_control ON security_control.PK_SECURITY_CONTROL_ID = system_control_test.FK_SECURITY_CONTROL_ID
     JOIN system_control_test_procedure_types_default ON system_control_test_procedure_types_default.PK_SYSTEM_CONTROL_TESt_PROCEDURE_TYPE_ID = system_control_test.FK_PROCEDURE_TYPE_ID
     JOIN work_item_result ON system_control_test.PK_SYSTEM_CONTROL_TEST_ID = work_item_result.FK_SYSTEM_CONTROL_TEST_ID
     JOIN system on system.PK_SYSTEM_ID = system_control_test.FK_SYSTEM_ID
     JOIN work_item_status_default ON work_item_status_default.PK_WORK_ITEM_STATUS_ID = work_item_result.FK_WORK_ITEM_STATUS_ID
     JOIN control_weakness_type_default ON control_weakness_type_default.PK_CONTROL_WEAKNESS_TYPE_ID = work_item_result.FK_CONTROL_WEAKNESS_TYPE_ID
    WHERE system.NAME = ?
    GROUP BY security_control.NAME`;

    if (!include_satisfied) {
        sql += ` AND work_item_result.FK_WORK_ITEM_STATUS_ID != 1 /* NOT A PASS */`;
    }


    mysql.createConnection({
        host: config.mysql.host,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database

    }).then(conn => {
        connection = conn
        //console.log('connected as id ' + connection.threadId);

        sql = mysql.format(sql, [system_name]);
        return connection.query(sql);


    }).then((data) => {
        if(data.length != 0) {
            // make adjustments to results from query before writing output to cosa.csv file
            // decide the overall status
            data.forEach(function (result) {
                // TEST_RESULT
                if ((result.TEST_RESULT.indexOf('Fail') != -1) || (result.TEST_RESULT.indexOf('Incomplete') != -1)) {
                      result.TEST_RESULT = 'Other Than Satisfied';
                } else {
                    result.TEST_RESULT = 'Satisfied'
                }

                // TEST_METHOD
                var testMethodString = result.TEST_METHOD;
                result.TEST_METHOD = ''; //default
                if (testMethodString.indexOf('manual') != -1) {
                    //found a manual test, so output 'Examine;Interview' to COSA file
                    result.TEST_METHOD = 'Examine;Interview';
                } 
                // now remove the 'manual' from the string we are working with so we can just see what's left (e.g., non-manuals)
                testMethodString = remove_character(testMethodString, 'manual');
                
                if(testMethodString.length > 0) {
                    // we know we have something other than 'manual' as a test method, so output concatinated 'Test' to the COSA file
                    if(result.TEST_METHOD != '') {
                        result.TEST_METHOD = result.TEST_METHOD + '; Test';
                    } else {
                        result.TEST_METHOD = 'Test';
                    }
                }
                
                // LIKLIHOOD and IMPACT Display in COSA file
                if(result.TEST_RESULT != 'Other Than Satisfied'){
                    result.LIKELIHOOD = '';
                    result.IMPACT = '';
                    // Additionally, Adding 'blanks' on COSA output for REPEAT_FINDINGS and CONTROL WEAKNESS as per Ken's request 1/16/2020
                    result.REPEAT_FINDINGS = '';
                    result.CONTROL_WEAKNESS_TYPE = '';
                }

                // TEST_RESULT_DESCRIPTION
                // remove any duplicate semi-colons
                result.TEST_RESULT_DESCRIPTION = result.TEST_RESULT_DESCRIPTION.replace(/(^[;\s]+)|([;\s]+$)/g, '');
                result.FINDING_TITLE = result.FINDING_TITLE.replace(/(^[;\s]+)|([;\s]+$)/g, ''); 
                result.FINDING_DESCRIPTION = result.FINDING_DESCRIPTION.replace(/(^[;\s]+)|([;\s]+$)/g, ''); 
                result.WEAKNESS_DESCRIPTION = result.WEAKNESS_DESCRIPTION.replace(/(^[;\s]+)|([;\s]+$)/g, ''); 
                result.RECOMMENDED_CORRECTIVE_ACTIONS = result.RECOMMENDED_CORRECTIVE_ACTIONS.replace(/(^[;\s]+)|([;\s]+$)/g, ''); 
                result.EFFECT_ON_BUSINESS = result.EFFECT_ON_BUSINESS.replace(/(^[;\s]+)|([;\s]+$)/g, ''); 
                result.TEST_OBJECTIVE = result.TEST_OBJECTIVE.replace(/(^[;\s]+)|([;\s]+$)/g, ''); 

            }); 
            // now write data to COSA.csv
            csvWriter
            .writeRecords(data)
            .then(() => {
                connection.end();
                console.log('The COSA file was written successfully for System: '+system_name);
                console.log('Data length = ' + data.length + ' records');
                return callback('reports/cosa/'+ filename);
            }
            );
        }// end data.length != 0
         else {
             console.log('No data available to build a COSA file for System: '+system_name);
             console.log('Data length = ' + data.length + ' records');
             connection.end();
             return callback(null);
        }
    }).catch((err) => {
        console.error('error:' + err.stack);
        connection.end();
    })

    function remove_character(str_to_remove, str) {
        let reg = new RegExp(str_to_remove)
        return str.replace(reg, '')
      }
}
