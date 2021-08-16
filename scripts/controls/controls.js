var controljson = require('./controls.json')
var controls = controljson['controls:controls']['controls:control']
var mysql = require('mysql');
var config = require('./config');

var mysqlOptions = {
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
};

var connection = mysql.createConnection(mysqlOptions);


connection.connect(function (err) {
    if (err) {
        console.log("MySQL connection error: " + err);
        console.log("Stopping the app.");
        process.exit();
    } else {
        console.log("Connected to MySQL");
        insertRecords()
    }
});

function insertRecords() {
    for (var x in controls) {
        let control_name = controls[x].number;
        let family = controls[x].family;
        let title = controls[x].title;
        let priority = (controls[x].priority) ? controls[x].priority : '';
        let baselineImpact = (controls[x]['baseline-impact']) ? controls[x]['baseline-impact'].toString() : "";
        let description = controls[x].statement.description;
        let supplemental_guidance = (controls[x]['supplemental-guidance']) ? (controls[x]['supplemental-guidance'].description ? controls[x]['supplemental-guidance'].description : '') : '';
        let related = (controls[x]['supplemental-guidance']) ? ((controls[x]['supplemental-guidance'].related) ? controls[x]['supplemental-guidance'].related.toString() : null) : null;

        let insert = "INSERT INTO Security_Control (NAME,FAMILY,TITLE,PRIORITY,BASELINE_IMPACT,DESCRIPTION,SUPPLEMENTAL_GUIDANCE,RELATED_CONTROLS) VALUES (?,?,?,?,?,?,?,?)";


        let subControls = controls[x].statement;

        doInsert(subControls, '', function (sNum, sDesc) {
            let params = []
            if (sNum) {
                params = [sNum, family, title, priority, baselineImpact, sDesc, supplemental_guidance, related];

            } else {
                params = [control_name, family, title, priority, baselineImpact, description, supplemental_guidance, related];

            }

            connection.query(insert, params, function (err, rows, fields) {
                if (err) {
                    console.log(control_name)
                    console.log(err.sqlMessage)
                }
            });

        })
        let controlEnhancements = (controls[x]['control-enhancements'])
        if (controlEnhancements) {
            let ce = controlEnhancements["control-enhancement"];
            if (ce[0]) {
                for (var y in ce) {
                    let ce_control_name = ce[y].number;
                    let ce_title = ce[y].title;
                    let ce_priority = (ce[y].priority) ? ce[y].priority : '';
                    let ce_baselineImpact = (ce[y]['baseline-impact']) ? ce[y]['baseline-impact'].toString() : "";
                    let ce_description = ce[y].statement.description;
                    let ce_supplemental_guidance = (ce[y]['supplemental-guidance']) ? (ce[y]['supplemental-guidance'].description ? ce[y]['supplemental-guidance'].description : '') : '';
                    let ce_related = (ce[y]['supplemental-guidance']) ? ((ce[y]['supplemental-guidance'].related) ? ce[y]['supplemental-guidance'].related.toString() : null) : null;


                    let subControls = ce[y].statement;

                    doInsert(subControls, '', function (sNum, sDesc) {
                        let ce_params = []
                        if (sNum) {
                            ce_params = [sNum, family, ce_title, ce_priority, ce_baselineImpact, sDesc, ce_supplemental_guidance, ce_related];

                        } else {
                            ce_params = [ce_control_name, family, ce_title, ce_priority, ce_baselineImpact, sDesc, ce_supplemental_guidance, ce_related];
                        }

                        connection.query(insert, ce_params, function (err, rows, fields) {
                            if (err) {
                                console.log(control_name)
                                console.log(err.sqlMessage)
                            }
                        });

                    })

                }
            } else {
                let ce1_control_name = ce.number;
                let ce1_title = ce.title;
                let ce1_priority = (ce.priority) ? ce[y].priority : '';
                let ce1_baselineImpact = (ce['baseline-impact']) ? ce['baseline-impact'].toString() : "";

                let ce1_supplemental_guidance = (ce['supplemental-guidance']) ? (ce['supplemental-guidance'].description ? ce['supplemental-guidance'].description : '') : '';
                let ce1_related = (ce['supplemental-guidance']) ? ((ce['supplemental-guidance'].related) ? ce['supplemental-guidance'].related.toString() : null) : null;
                let ce1_description = ce.statement.description;

                let subControls = ce.statement;

                doInsert(subControls, '', function (sNum, sDesc) {
                    let ce1_params = []
                    if (sNum) {
                        ce1_params = [sNum, family, ce1_title, ce1_priority, ce1_baselineImpact, sDesc, ce1_supplemental_guidance, ce1_related];

                    } else {
                        ce1_params = [ce1_control_name, family, ce1_title, ce1_priority, ce1_baselineImpact, sDesc, ce1_supplemental_guidance, ce1_related];
                    }

                    connection.query(insert, ce1_params, function (err, rows, fields) {
                        if (err) {
                            console.log(control_name)
                            console.log(err.sqlMessage)
                        }
                    });
                })


                console.log(x + ": " + ce.number + " - " + related)
            }
        }

    }
    connection.end()
}


function doInsert(s, desc, cb) {
    desc = desc + ' ' + s.description
    if (!("statement" in s)) {
        return cb(s.number, desc)
    }

    for (var i = 0; i < s.statement.length; i++) {
        doInsert(s.statement[i], desc, cb)
    }
    return [s.number, desc]
}
