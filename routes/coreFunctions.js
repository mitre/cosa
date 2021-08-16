/*
   Copyright 2021 The MITRE Corporation

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/* This file exists to provide capability
* needed across many of the components
* within the cosa GUI.
*/

module.exports = {

    getComplianceCounts: function (connection, systemID, callback) {
        var sql = `SELECT sys.NAME, 
        SUM(work_item_status_default.NAME = 'Pass') AS 'passedTests',
        SUM(work_item_status_default.NAME = 'Fail') AS 'failedTests',
        SUM(work_item_status_default.NAME = 'Incomplete') AS 'incompleteTests',
        SUM(work_item_status_default.NAME = 'Risk Accepted') AS 'riskAcceptedTests',
        SUM(system_control_test.DEPENDS_ON_SYSTEM_ID IS NOT NULL) AS 'inheritedTests',
        (SELECT count(*)
            FROM system_control_test
            INNER JOIN system_control_test_procedure_types_default ON system_control_test_procedure_types_default.PK_SYSTEM_CONTROL_TEST_PROCEDURE_TYPE_ID = system_control_test.FK_PROCEDURE_TYPE_ID
            INNER JOIN system sys2 ON sys2.PK_SYSTEM_ID = system_control_test.FK_SYSTEM_ID
            WHERE system_control_test.FK_PROCEDURE_TYPE_ID IS NOT NULL
            and system_control_test.applicable = 1
                AND system_control_test_procedure_types_default.NAME != 'manual'
                AND system_control_test.DEPENDS_ON_SYSTEM_ID IS NULL
                AND sys2.NAME = sys.name) as automatedTests,
        (SELECT count(*)
                FROM system_control_test
                INNER JOIN system_control_test_procedure_types_default ON system_control_test_procedure_types_default.PK_SYSTEM_CONTROL_TEST_PROCEDURE_TYPE_ID = system_control_test.FK_PROCEDURE_TYPE_ID
                INNER JOIN system sys3 ON sys3.PK_SYSTEM_ID = system_control_test.FK_SYSTEM_ID
                WHERE system_control_test_procedure_types_default.NAME = 'manual'
                    AND system_control_test.DEPENDS_ON_SYSTEM_ID IS NULL
                    AND system_control_test.applicable = 1
                    AND sys3.NAME = sys.name) as manualTests,
        count(system_control_test.PK_SYSTEM_CONTROL_TEST_ID) as totalTests,
        (SELECT count(distinct system_control_test.FK_SECURITY_CONTROL_ID)
                    FROM system_control_test
                    INNER JOIN work_item_result ON work_item_result.FK_SYSTEM_CONTROL_TEST_ID= system_control_test.PK_SYSTEM_CONTROL_TEST_ID
                    WHERE system_control_test.applicable = 1
                        AND system_control_test.FK_SYSTEM_ID = ` +systemID+ `
                        AND work_item_result.FK_WORK_ITEM_STATUS_ID = 1) as passedControls,
         (SELECT count(distinct system_control_test.FK_SECURITY_CONTROL_ID)
                    FROM system_control_test
                    INNER JOIN work_item_result ON work_item_result.FK_SYSTEM_CONTROL_TEST_ID= system_control_test.PK_SYSTEM_CONTROL_TEST_ID
                    WHERE system_control_test.applicable = 1
                        AND system_control_test.FK_SYSTEM_ID = ` +systemID+ `
                        AND work_item_result.FK_WORK_ITEM_STATUS_ID = 2) as failedControls,
         (SELECT count(distinct system_control_test.FK_SECURITY_CONTROL_ID)
                    FROM system_control_test
                    INNER JOIN work_item_result ON work_item_result.FK_SYSTEM_CONTROL_TEST_ID= system_control_test.PK_SYSTEM_CONTROL_TEST_ID
                    WHERE system_control_test.applicable = 1
                        AND system_control_test.FK_SYSTEM_ID = ` +systemID+ `
                        AND work_item_result.FK_WORK_ITEM_STATUS_ID = 3) as incompleteControls,
        count(distinct system_control_test.FK_SECURITY_CONTROL_ID) as totalControls
        FROM work_item_result wir
        INNER JOIN work_item_status_default ON work_item_status_default.PK_WORK_ITEM_STATUS_ID = wir.FK_WORK_ITEM_STATUS_ID
        INNER JOIN system_control_test ON system_control_test.PK_SYSTEM_CONTROL_TEST_ID = wir.FK_SYSTEM_CONTROL_TEST_ID
        INNER JOIN security_control ON security_control.PK_SECURITY_CONTROL_ID = system_control_test.FK_SECURITY_CONTROL_ID
        INNER JOIN system sys ON sys.PK_SYSTEM_ID = system_control_test.FK_SYSTEM_ID
        WHERE system_control_test.applicable = 1 and system_control_test.FK_SYSTEM_ID = ?`;

        connection.query(sql, systemID, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },
    
    getCategorizations: function (connection, callback) {
        var sql = "SELECT PK_CATEGORIZATION_ID, NAME FROM categorization_default";
        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getWorkItemStatus: function (connection, callback) {
        var sql = "SELECT PK_WORK_ITEM_STATUS_ID, NAME FROM work_item_status_default";
        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getSystemRolesForSystemId: function (connection, systemID, callback) {
        var sql = `SELECT system.PK_SYSTEM_ID, system.NAME,  
		system_role.FK_USER_ID, user.USER_NAME, FK_ROLE_ID, system_roles_default.NAME as ROLE_NAME
        FROM system_role INNER JOIN system ON system.PK_SYSTEM_ID = system_role.FK_SYSTEM_ID
        INNER JOIN user ON user.PK_USER_ID = system_role.FK_USER_ID
        INNER JOIN system_roles_default ON system_roles_default.PK_ROLE_ID = system_role.FK_ROLE_ID
        WHERE system.PK_SYSTEM_ID = ?`;
        connection.query(sql, systemID, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getCOSAResultsBySystem: function (connection, systemID, callback) {
        var sql = `SELECT * FROM cosa_results_report WHERE SYSTEM_ID = ? ORDER BY CONTROL_NAME;`;
        connection.query(sql, systemID, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getCOSASubCapabilityResultsBySystem: function (connection, systemID, callback) {
        var sql = `SELECT capabilities.SUB_CAPABILITY_NAME AS SUB_CAPABILITY_NAME, capabilities.DESCRIPTION,
        GROUP_CONCAT(DISTINCT capabilities.SUB_CAPABILITY_NAME, STATUS ORDER BY capabilities.SUB_CAPABILITY_NAME, STATUS ASC separator ',') AS ROLL_UP,
        GROUP_CONCAT(DISTINCT INHERITED_FROM ORDER BY INHERITED_FROM ASC separator ', ') AS ALL_DEPENDS_ON,
        GROUP_CONCAT(DISTINCT CONTROL_NAME ORDER BY CONTROL_NAME ASC separator ', ') AS ALL_CONTROL_NAMES,
        GROUP_CONCAT(DISTINCT EVIDENCE_FILES ORDER BY EVIDENCE_FILES ASC separator ', ') AS ALL_EVIDENCE_FILES
        FROM cosa_results_report 
        JOIN capabilities ON capabilities.SECURITY_CONTROL_NAME = CONTROL_NAME
        WHERE SYSTEM_ID = ?
        GROUP BY capabilities.SUB_CAPABILITY_NAME, capabilities.DESCRIPTION;`;
        connection.query(sql, systemID, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getCOSAControlResultsBySystem: function (connection, systemID, callback) {
        var sql = `SELECT count(*) AS FINDINGS_COUNT, CONTROL_NAME, DESCRIPTION,
        GROUP_CONCAT(DISTINCT CONTROL_NAME, STATUS ORDER BY CONTROL_NAME, STATUS ASC separator ',') AS ROLL_UP,
        GROUP_CONCAT(DISTINCT INHERITED_FROM ORDER BY INHERITED_FROM ASC separator ', ') AS ALL_DEPENDS_ON,
        GROUP_CONCAT(DISTINCT EVIDENCE_FILES ORDER BY EVIDENCE_FILES ASC separator ', ') AS ALL_EVIDENCE_FILES
        FROM cosa_results_report 
        WHERE SYSTEM_ID = ? 
        GROUP BY CONTROL_NAME, DESCRIPTION`;
        connection.query(sql, systemID, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getCOSACapabilityTreeMapBySystem: function(connection, systemId, callback){
        var sql = `(select c.NAME AS NAME, "Capabilities" AS PARENT, COUNT(srr.CONTROL_NAME )AS TEST_COUNT, 1 AS Color From capabilities c
        JOIN cosa_results_report srr ON c.SECURITY_CONTROL_NAME = srr.CONTROL_NAME
        WHERE srr.SYSTEM_ID = ?
        group by c.NAME)
        UNION
        (select c.SUB_CAPABILITY_NAME AS NAME, c.NAME AS PARENT, COUNT(srr.CONTROL_NAME ) AS TEST_COUNT, 1 AS Color from capabilities c
        JOIN cosa_results_report srr ON c.SECURITY_CONTROL_NAME = srr.CONTROL_NAME
        WHERE srr.SYSTEM_ID = ?
        GROUP BY c.SUB_CAPABILITY_NAME, c.NAME) UNION (SELECT CONCAT(srr.PK_WORK_ITEM_RESULT_ID,"_",c.SUB_CAPABILITY_NAME,"_",srr.CONTROL_NAME) AS NAME,  c.SUB_CAPABILITY_NAME AS PARENT, 1 AS TEST_COUNT, wisd.PK_WORK_ITEM_STATUS_ID AS Color FROM cosa_results_report srr
        JOIN capabilities c ON c.SECURITY_CONTROL_NAME = srr.CONTROL_NAME
        JOIN work_item_status_default wisd ON wisd.NAME = srr.STATUS
        WHERE srr.SYSTEM_ID = ?);`
        connection.query(sql, [systemId,systemId,systemId], function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },
    
    getTestsBySystem: function (connection, systemID, callback) {
        var sql = `SELECT * FROM all_items WHERE FK_SYSTEM_ID = ? ORDER BY CONTROL_ITEM;`;
        connection.query(sql, systemID, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getTestMethods: function (connection, callback) {
        var sql = "SELECT PK_TEST_METHOD_ID, NAME FROM test_method_default";
        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getStages: function (connection, callback) {
        var sql = "SELECT PK_STAGE_DEFAULT_ID, NAME FROM stage_default";
        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getScopes: function (connection, callback) {
        var sql = "SELECT PK_TEST_SCOPE_DEFAULT_ID, NAME FROM test_scope_default";
        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getComponents: function (connection, callback) {
        var sql = `SELECT PK_COMPONENT_ID, CONCAT(component_type_default.NAME,":",component_product_default.NAME) AS NAME 
        FROM components
        INNER JOIN component_type_default ON component_type_default.PK_COMPONENT_TYPE_DEFAULT_ID = components.FK_TYPE_ID
        INNER JOIN component_product_default ON component_product_default.PK_COMPONENT_PRODUCT_DEFAULT_ID = components.FK_PRODUCT_ID`;

        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {

                console.log("COMPONENTS: " + JSON.stringify(results));

                return callback(results);
            }
        });
    },

    getControlWeaknessTypes: function (connection, callback) {
        var sql = "SELECT PK_CONTROL_WEAKNESS_TYPE_ID, NAME FROM control_weakness_type_default";
        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getProcedureTypes: function (connection, callback) {
        var sql = "SELECT PK_SYSTEM_CONTROL_TEST_PROCEDURE_TYPE_ID, NAME FROM system_control_test_procedure_types_default";
        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getTestSources: function (connection, callback) {
        var sql = "SELECT PK_TEST_SOURCE_ID, NAME FROM test_source_default";
        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getSystems: function (connection, callback) {
        var sql = "SELECT PK_SYSTEM_ID, NAME FROM system WHERE system.ACTIVE != 0";
        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    // Will return both ACTIVE and INACTIVE system IDs and Names for displaying on GUI
    getLocalSystems: function (connection, callback) {

        var sql = "SELECT PK_SYSTEM_ID, NAME FROM system WHERE PK_SYSTEM_ID != 0 AND IS_REMOTE = 0";

        connection.query(sql, function (err, results) {

            if (err) {

                console.log("SQL Error: " + err);

                return callback(null);

            } else {

                console.log("Local systems: " + JSON.stringify(results));

                return callback(results);

            }
        });
    },

    getSystemNameById: function (connection, systemID, callback) {
        var sql = "SELECT PK_SYSTEM_ID, NAME FROM system WHERE PK_SYSTEM_ID = ?";
        connection.query(sql, systemID, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getSystemConfiguration: function (connection, systemId, encoder, callback) {

        var sql = `SELECT * FROM system WHERE system.PK_SYSTEM_ID = ?`;

        connection.query(sql, systemId, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {

                console.log("config: " + JSON.stringify(results));
                return callback(results);

            }
        });
    },

    getSystemConfigurationWithNames: function (connection, systemId, encoder, callback) {

        var sql = `SELECT s.NAME, s.ACRONYM, c.NAME AS CATEGORIZATION, s.DESCRIPTION, s.ACTIVE,
        (CASE
                   WHEN (s.HIGH_VALUE_ASSET = '0') THEN 'No'
                   WHEN (s.HIGH_VALUE_ASSET = '1') THEN 'Yes'
               END) AS HIGH_VALUE_ASSET,
       (CASE
                   WHEN (s.IS_REMOTE = '0') THEN 'No'
                   WHEN (s.IS_REMOTE = '1') THEN 'Yes'
               END) AS IS_REMOTE        
       FROM system s
       INNER JOIN categorization_default c ON c.PK_CATEGORIZATION_ID = s.FK_CATEGORIZATION_ID
       WHERE s.PK_SYSTEM_ID = ?`;

        connection.query(sql, systemId, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {

                //console.log("config: " + JSON.stringify(results));
                return callback(results);

            }
        });
    },

    getUsers: function (connection, callback) {
        var sql = "SELECT PK_USER_ID, USER_NAME FROM user";
        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getUserIdForName: function (connection, username, callback) {
        var sql = "SELECT PK_USER_ID FROM user WHERE USER_NAME = ?";
        connection.query(sql, username, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getSystemRoles: function (connection, callback) {
        var sql = "SELECT PK_ROLE_ID, NAME, DESCRIPTION FROM system_roles_default";
        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getSystemRolesDescForName: function (connection, aName, callback) {
        var sql = "SELECT DESCRIPTION FROM system_roles_default WHERE NAME = ?";
        connection.query(sql, aName, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getComponentsForSystemId: function (connection, systemID, callback) {
        var sql = `SELECT DISTINCT component_type_default.NAME
                   FROM system_control_test
                   INNER JOIN components ON components.PK_COMPONENT_ID = system_control_test.FK_COMPONENT_ID
                   INNER JOIN component_type_default ON component_type_default.PK_COMPONENT_TYPE_DEFAULT_ID = components.FK_TYPE_ID
                   WHERE system_control_test.FK_SYSTEM_ID = ? AND NAME != 'default' AND APPLICABLE = 1`
        connection.query(sql, systemID, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getSecurityControls: function (connection, callback) {
        var sql = "SELECT PK_SECURITY_CONTROL_ID, NAME FROM security_control";
        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getSecurityControlsForSystemId: function (connection, systemID, callback) {
        var sql = `SELECT DISTINCT security_control.PK_SECURITY_CONTROL_ID, security_control.NAME, security_control.FAMILY, security_control.TITLE
                   FROM system_control_test
                   INNER JOIN security_control ON system_control_test.FK_SECURITY_CONTROL_ID = security_control.PK_SECURITY_CONTROL_ID
                   WHERE system_control_test.FK_SYSTEM_ID = ? AND system_control_test.APPLICABLE = 1`;
        connection.query(sql, systemID, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getUnassociatedSecurityControls: function (connection, systemID, callback) {

        var sql = `SELECT security_control.PK_SECURITY_CONTROL_ID, security_control.NAME 
                   FROM security_control
                    WHERE PK_SECURITY_CONTROL_ID NOT IN (
                        SELECT DISTINCT security_control.PK_SECURITY_CONTROL_ID
                        FROM system_control_test
                        INNER JOIN security_control ON system_control_test.FK_SECURITY_CONTROL_ID = security_control.PK_SECURITY_CONTROL_ID
                        WHERE system_control_test.FK_SYSTEM_ID = ? AND system_control_test.APPLICABLE = 1)`;

        connection.query(sql, systemID, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    inheritAllFindings: function (connection, callback) {

        var sql = `UPDATE  work_item_result t, system_control_test t_r, work_item_result inh, system_control_test inh_r
        SET t.RESULT_DESC                    = inh.RESULT_DESC,
        t.FK_WORK_ITEM_STATUS_ID         = inh.FK_WORK_ITEM_STATUS_ID,
        t.EXPIRATION_DATE                = inh.EXPIRATION_DATE,
        t.REPEAT_FINDING                 = inh.REPEAT_FINDING,
        t.FINDING_TITLE                  = inh.FINDING_TITLE,
        t.FINDING_DESCRIPTION            = inh.FINDING_DESCRIPTION,
        t.WEAKNESS_DESCRIPTION           = inh.WEAKNESS_DESCRIPTION,
        t.FK_CONTROL_WEAKNESS_TYPE_ID    = inh.FK_CONTROL_WEAKNESS_TYPE_ID,
        t.RECOMMENDED_CORRECTIVE_ACTIONS = '', /* Not Target Responsibility */
        t.EFFECT_ON_BUSINESS             = inh.EFFECT_ON_BUSINESS,
        t.FK_LIKELIHOOD_ID               = inh.FK_LIKELIHOOD_ID,
        t.FK_IMPACT_ID                   = inh.FK_IMPACT_ID,
        t.REMEDIATION_DATE               = inh.REMEDIATION_DATE,
        t.UPDATED_BY                     = 'INHERITED'
    WHERE
        /* Same Control ... */
        t.FK_SYSTEM_CONTROL_TEST_ID      = t_r.PK_SYSTEM_CONTROL_TEST_ID AND
        inh.FK_SYSTEM_CONTROL_TEST_ID    = inh_r.PK_SYSTEM_CONTROL_TEST_ID AND
        t_r.CONTROL_ITEM                 = inh_r.CONTROL_ITEM AND
        /* Not Same Item ... */
        t.PK_WORK_ITEM_RESULT_ID         != inh.PK_WORK_ITEM_RESULT_ID AND
        /* inh System Is Target's Depends On System */
        t_r.DEPENDS_ON_SYSTEM_ID         = inh_r.FK_SYSTEM_ID`;

        connection.query(sql, function (err, results) {
            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    /* Get Compliance details to populate the details table */
    getFindingsForSystemId: function (connection, systemID, status, callback) {

        var params = new Array();

        var sql = `SELECT * FROM all_findings WHERE PK_SYSTEM_ID = ?`;

        if (status != "all") {

            sql = sql + "AND STATUS = ?";

            params = [systemID, status];

        } else {

            params = [systemID];

        }

        connection.query(sql, params, function (err, results) {

            if (err) {

                console.log("SQL Error: " + err)

                return callback(null);

            } else {

                var finalResults = Array();
                var finalResult;
                var testType;

                results.forEach(r => {

                    testType = { "TEST_TYPE": "Manual" };

                    if (r.DEPENDS_ON_SYSTEM != null) {
                        testType = { "TEST_TYPE": "Inherited" };
                    } else if (r.IS_MANUAL == 0) {
                        testType = { "TEST_TYPE": "Automated" };
                    }

                    if (r.DEPENDS_ON_SYSTEM == null) r.DEPENDS_ON_SYSTEM = "None";

                    finalResult = Object.assign(r, testType);

                    finalResults.push(finalResult);

                });

                //console.log("getFindingsForSytemID " + systemID + ": " + JSON.stringify(finalResults));
                return callback(finalResults);

            }
        });
    },

    // Returns all of the templates that are available.
    getTemplates: function (connection, callback) {

        var sql = `SELECT * FROM template_default`;

        connection.query(sql, function (err, results) {

            if (err) {

                console.log("SQL Error: " + err)
                return callback(null);

            } else {

                return callback(results);

            }
        });
    },

    // Given systemId or templateId this returns all of the applicable/not applicable catalogs.
    // If applicable is null then ALL catalogs for the system or template are returned.
    // key is 'ALL', 'TEMPLATE' or 'SYSTEM' indicating the id type (ALL means no id, return all catalogs).
    getCatalogs: function (connection, key, id, applicable, callback) {

        let queryAdd = "";
        params = [];

        if (key != 'ALL') {

            if (key == 'SYSTEM') {

                queryAdd = ` INNER JOIN system_control_test ON system_control_test.FK_CATALOG_ID = catalog_default.PK_CATALOG_DEFAULT_ID
                             INNER JOIN system ON system.PK_SYSTEM_ID = system_control_test.FK_SYSTEM_ID
                                   WHERE catalog_default.PK_CATALOG_DEFAULT_ID != 0 AND system_control_test.FK_SYSTEM_ID = ?`;

            } else if (key == 'TEMPLATE') {

                queryAdd = ` INNER JOIN template_catalog ON template_catalog.FK_CATALOG_ID = catalog_default.PK_CATALOG_DEFAULT_ID
                                   WHERE catalog_default.PK_CATALOG_DEFAULT_ID != 0 AND template_catalog.FK_TEMPLATE_ID = ?`

            }

            params = [id];

            if (applicable != null) {

                queryAdd = queryAdd + ` AND system_control_test.APPLICABLE = ?`;

                params = [id, applicable];

            }
        }

        var sql = `SELECT DISTINCT catalog_default.PK_CATALOG_DEFAULT_ID, catalog_default.NAME, catalog_default.ABV, catalog_default.ORGANIZATION, catalog_default.DESCRIPTION FROM catalog_default ` + queryAdd + ` ORDER BY catalog_default.NAME`;

        connection.query(sql, params, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    isValid: function (id) {

        return parseInt(id) != NaN;

    },

    // Given a system id this returns all of the inheritances.
    getInheritances: function (connection, systemId, applicable, callback) {

        let queryAdd = "";
        let params = [systemId];

        if (applicable != null) {

            queryAdd = ` AND system_control_test.APPLICABLE = ?`;

            params = [systemId, applicable];

        }

        var sql = `SELECT DISTINCT system.PK_SYSTEM_ID, system.NAME, system.DESCRIPTION
                   FROM system
                   INNER JOIN system_control_test ON system.PK_SYSTEM_ID = system_control_test.DEPENDS_ON_SYSTEM_ID
                   WHERE system_control_test.FK_SYSTEM_ID = ? AND system_control_test.INHERITABLE = 1` + queryAdd + ` ORDER BY system.NAME`;

        connection.query(sql, params, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    // Given a system id this returns all security controls with no tests.
    getUntestedControls: function (connection, systemId, callback) {
        let params = [systemId];

        var sql = `Select s.PK_SECURITY_CONTROL_ID, s.NAME from security_control s
        Where s.PK_SECURITY_CONTROL_ID NOT IN (Select distinct a.FK_SECURITY_CONTROL_ID from all_items a
        Where FK_SYSTEM_ID = ?) ORDER BY s.NAME`;

        connection.query(sql, params, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getUntestedSecurityControlsCount: function (connection, systemId, callback) {
        let params = [systemId];

        var sql = `SELECT count(s.NAME) AS UNTESTED
        FROM security_control s
        WHERE s.PK_SECURITY_CONTROL_ID 
        NOT IN (SELECT DISTINCT a.FK_SECURITY_CONTROL_ID FROM all_items a WHERE FK_SYSTEM_ID = ?)`;

        connection.query(sql, params, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    getTotalSecurityControlsCount: function (connection, callback) {
        var sql = "SELECT count(*) AS TOTAL FROM security_control";

        connection.query(sql, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    // Given a system id and applicable value (0=no, 1=yes), this returns the
    // matching distinct component type information.
    getComponentTypes: function (connection, systemId, applicable, callback) {

        let queryAdd = "";
        let params = [systemId];

        if (applicable != null) {

            queryAdd = ` AND system_control_test.APPLICABLE = ?`;

            params = [systemId, applicable];

        }

        var sql = `SELECT DISTINCT component_type_default.PK_COMPONENT_TYPE_DEFAULT_ID,
        component_type_default.NAME, component_type_default.DESCRIPTION
        FROM component_type_default
        INNER JOIN components ON component_type_default.PK_COMPONENT_TYPE_DEFAULT_ID = components.FK_TYPE_ID
        INNER JOIN system_control_test ON system_control_test.FK_COMPONENT_ID = components.PK_COMPONENT_ID
        INNER JOIN system ON system.PK_SYSTEM_ID = system_control_test.FK_SYSTEM_ID
        WHERE system_control_test.FK_SYSTEM_ID = ? AND component_type_default.PK_COMPONENT_TYPE_DEFAULT_ID != 0` + queryAdd
            + ` ORDER BY component_type_default.NAME`;

        connection.query(sql, params, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    // Given a system id, this returns the applicable matching component ids and typeIds 
    getComponentsForSystemId: function (connection, systemId, applicable, callback) {

        let queryAdd = "";
        let params = [];

        if (systemId != null) {

            queryAdd = ` WHERE system_control_test.FK_SYSTEM_ID = ? AND component_type_default.name != 'default'`;

            params = [systemId];


            if (applicable != null) {

                queryAdd = queryAdd + ` AND system_control_test.APPLICABLE = ?`;

                params[params.length] = applicable;

            }
        }

        console.log("Applicable: " + params);

        var sql = `SELECT DISTINCT component_type_default.PK_COMPONENT_TYPE_DEFAULT_ID,
        component_type_default.NAME AS COMPONENT_TYPE, component_type_default.DESCRIPTION AS COMPONENT_TYPE_DESCRIPTION,
        component_product_default.PK_COMPONENT_PRODUCT_DEFAULT_ID, component_product_default.NAME AS COMPONENT_PRODUCT,
        component_product_default.DESCRIPTION AS COMPONENT_PRODUCT_DESCRIPTION
        FROM components
        INNER JOIN component_type_default ON component_type_default.PK_COMPONENT_TYPE_DEFAULT_ID = components.FK_TYPE_ID
        INNER JOIN component_product_default ON component_product_default.PK_COMPONENT_PRODUCT_DEFAULT_ID = components.FK_PRODUCT_ID
        INNER JOIN system_control_test ON system_control_test.FK_COMPONENT_ID = components.PK_COMPONENT_ID
        INNER JOIN system ON system.PK_SYSTEM_ID = system_control_test.FK_SYSTEM_ID ` + queryAdd
            + ` ORDER BY COMPONENT_TYPE;`;


        connection.query(sql, params, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    // Given a system id, this returns the applicable matching component ids and typeIds 
    // (multiple components may have matching type and/or product ids).
    getComponentsForSystemIdAndTypeId: function (connection, systemId, typeId, applicable, callback) {

        let queryAdd = "";
        let params = [];

        if (systemId != null) {

            queryAdd = ` WHERE system_control_test.FK_SYSTEM_ID = ? AND component_type_default.name != 'default'`;

            params = [systemId];

            if (typeId != null) {

                queryAdd = queryAdd + ` AND components.FK_TYPE_ID = ?`;

                params = [systemId, typeId];

            }

            if (applicable != null) {

                queryAdd = queryAdd + ` AND system_control_test.APPLICABLE = ?`;

                params[params.length] = applicable;

            }
        }

        console.log("Applicable: " + params);

        var sql = `SELECT DISTINCT components.PK_COMPONENT_ID, components.DESCRIPTION,
        component_type_default.PK_COMPONENT_TYPE_DEFAULT_ID,
        component_type_default.name AS COMPONENT_TYPE, component_type_default.DESCRIPTION AS COMPONENT_TYPE_DESCRIPTION,
        component_product_default.PK_COMPONENT_PRODUCT_DEFAULT_ID, component_product_default.name AS COMPONENT_PRODUCT,
        component_product_default.DESCRIPTION AS COMPONENT_PRODUCT_DESCRIPTION
        FROM components
        INNER JOIN component_type_default ON component_type_default.PK_COMPONENT_TYPE_DEFAULT_ID = components.FK_TYPE_ID
        INNER JOIN component_product_default ON component_product_default.PK_COMPONENT_PRODUCT_DEFAULT_ID = components.FK_PRODUCT_ID
        INNER JOIN system_control_test ON system_control_test.FK_COMPONENT_ID = components.PK_COMPONENT_ID
        INNER JOIN system ON system.PK_SYSTEM_ID = system_control_test.FK_SYSTEM_ID ` + queryAdd
            + ` ORDER BY COMPONENT_TYPE, COMPONENT_PRODUCT`
            ;


        connection.query(sql, params, function (err, results) {

            if (err) {
                console.log("SQL Error: " + err)
                return callback(null);
            } else {
                return callback(results);
            }
        });
    },

    updateResults: function (connection, systemId, callback) {

        // Remove all results for non-applicable tests.                  
        var sql = `DELETE WIR FROM work_item_result WIR
            INNER JOIN system_control_test ON system_control_test.PK_SYSTEM_CONTROL_TEST_ID = WIR.FK_SYSTEM_CONTROL_TEST_ID
            WHERE system_control_test.FK_SYSTEM_ID = ? AND system_control_test.APPLICABLE = 0`;

        connection.query(sql, [systemId], function (err, results1) {

            if (err) {

                console.log('SQL ERR: ' + err);
                return callback("Error");

            } else {

                //Add results for applicable tests.                  
                var sql2 = `INSERT INTO work_item_result (FK_SYSTEM_CONTROL_TEST_ID, FK_WORK_ITEM_STATUS_ID,
                    RESULT_DESC, FORWARD_TO_ROLE_ID, UPDATED_BY, REPEAT_FINDING,
                    FK_CONTROL_WEAKNESS_TYPE_ID, FK_LIKELIHOOD_ID, FK_IMPACT_ID)
                    
                    SELECT PK_SYSTEM_CONTROL_TEST_ID AS FK_SYSTEM_CONTROL_TEST_ID,
                        3 AS FK_WORK_ITEM_STATUS_ID,
                        '' AS RESULT_DESC,
                        FK_ROLE_ID AS FORWARD_TO_ROLE_ID,
                        'system' AS UPDATED_BY,
                        0 AS REPEAT_FINDING,
                        1 AS FK_CONTROL_WEAKNESS_TYPE_ID,
                        1 AS FK_LIKELIHOOD_ID, 1 AS FK_IMPACT_ID
                    FROM system_control_test
                    WHERE FK_SYSTEM_ID = ? AND APPLICABLE = 1 
                    AND system_control_test.PK_SYSTEM_CONTROL_TEST_ID NOT IN (SELECT WIR.FK_SYSTEM_CONTROL_TEST_ID FROM work_item_result WIR)`;

                connection.query(sql2, [systemId], function (err, results2) {


                    if (err) {

                        console.log('SQL ERR: ' + err);
                        return callback("Error");

                    } else {

                        return callback("Success");

                    }
                });
            }
        });
    },

    resetWorkitemStatus: function (connection, workitemID, callback) {

        console.log("WI ID: " + workitemID);
        var sql = `UPDATE work_item_result
                SET FK_WORK_ITEM_STATUS_ID = 3, EXPIRATION_DATE = null, REMEDIATION_DATE = null, FORWARD_TO_ROLE_ID = 3
                WHERE PK_WORK_ITEM_RESULT_ID = ? `;

        connection.query(sql, [workitemID], function (err, results) {

            if (err) {

                console.log('SQL ERR: ' + err);
                return callback("Error");

            } else {
                module.exports.inheritAllFindings(connection, () => {
                    return callback("Success");
                });
            }
        })
    },

    deploySystem: function (connection, systemId, callback) {

        var sql1 = `UPDATE system
                SET ACTIVE = 1
                WHERE PK_SYSTEM_ID = ? `;

        connection.query(sql1, [systemId], function (err, results1) {

            if (err) {

                console.log('SQL ERR: ' + err);
                return callback("Error");

            } else {

                // Copy all of the tests matched by the template over from the baseline for the system id.                  
                var sql2 = `CALL createDefaultFindings(?);`;

                connection.query(sql2, [systemId], function (err, results2) {

                    if (err) {

                        console.log('SQL ERR: ' + err);
                        return callback("Error");

                    } else {

                        return callback("Success");

                    }
                });
            }
        })
    },

    jsonContains: function (json, keyname, value) {

        for (var k = 0; k < json.length; k++) {

            if (json[k][keyname] == value) {

                return true;

            }
        }

        return false;

    }
};
