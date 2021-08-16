var theDetailsTable;

// User clicked a row in the details table
var workItemDetailsTableSelect = function (data) {

    //var dTable = $('#workitemdetailstable').DataTable();
    //var data = dTable.row(this).data();

    console.log("Work Item Details: " + JSON.stringify(data));

    $('#aSystem').text(data.SYSTEM);
    $('#aControlName').text(data.CONTROL);
    $('#aControlDesc').text(data.CONTROL_DESC);
    $('#aControlTitle').text(data.TITLE);
    $('#aControlFamily').text(data.FAMILY);
    $('#aComponent').text(data.COMPONENT_NAME);
    $('#aProduct').text(data.PRODUCT_NAME);
    $('#aControlItem').text(data.CONTROL_ITEM);
    $('#aControlItemDescription').text(data.DESCRIPTION);
    $('#aProcedure').text(data.PROCEDURE_TYPE);
    $('#aTestType').text(data.TEST_TYPE);
    $('#aInheritedFrom').text(data.DEPENDS_ON_SYSTEM);
    $('#aRepeatFinding').text(data.REPEAT_FINDING);
    $('#aForwardToRole').text(data.ROLE_NAME);
    $('#aUpdatedBy').text(data.UPDATED_BY);

    var cosa = data.REPEAT_FINDING_COSA_WEAKNESS_ID;
    if (cosa == null) {
        cosa = "None";
    }

    $('#aRepeatFindingCOSAId').text(cosa);

    
    var findings = data.FINDING_DESCRIPTION;
    if (findings == null) {
        findings = "";
    }

    $('#aFindingDescription').text(findings);

    $('#aWeaknessType').text(data.WEAKNESS);

    var weakness = data.WEAKNESS_DESCRIPTION;
    if (weakness == null) {
        weakness = "";
    }

    $('#aWeaknessDesc').text(weakness);

    var action = data.RECOMMENDED_CORRECTIVE_ACTIONS;
    if (action == null) {
        action = "";
    }

    $('#aActionsDesc').text(action);

    var effect = data.EFFECT_ON_BUSINESS;
    if (effect == null) {
        effect = "";
    }

    $('#aEffectOnBusiness').text(effect);

    $('#aLikelihood').text(data.LIKELIHOOD);
    $('#aImpact').text(data.IMPACT);

    var status = data.STATUS;
    var cell = '<span class="label label-default">Unknown</span>';
    switch (status) {
        case "Pass":
            cell = '<span class="label label-success">Passed</span>'
            break;
        case "Incomplete":
            cell = '<span class="label label-warning">Incomplete</span>'
            break;
        case "Fail":
            cell = '<span class="label label-danger">Failed</span>'
            break;
        case "Risk Accepted":
            cell = '<span class="label label-info">Risk Accepted</span>'
            break;
        default:
            cell = '<span class="label label-default">' + data + '</span>'
            break;
    }

    $('#aStatus').html("<b>Status: </b>" + cell);

    var resultDesc = data.RESULT_DESC;
    if (resultDesc == null) {
        resultDesc = "";
    }

    $('#aStatusDesc').text(resultDesc);

    var expDate = data.EXPIRATION_DATE;
    if (expDate == null) {
        expDate = "none";
    } else {
        expDate = moment(expDate).format('MMM D, YYYY');
    }

    $('#aExpirationDate').text(expDate);

    var remDate = data.REMEDIATION_DATE;
    if (remDate == null) {
        remDate = "none";
    } else {
        remDate = moment(remDate).format('MMM D, YYYY');
    }

    $('#aRemediationDate').text(remDate);

    var modDate = data.MODIFIED_DATE;
    if (modDate == null) {
        modDate = "none";
    } else {
        modDate = moment(modDate).format('MMM D, YYYY');
    }

    $('#aModifiedDate').text(modDate);

    $('#descriptionModal').modal(); // show the detail description for the work_item_result STATUS

};

// Function to get values from DB for all the Findings shown in the charts
var loadDetails = function (systemID, stats) {

    var systemName;

    // Clean up table before trying to repopulate
    // The datatable needed to be destroyed if existed.
    if (theDetailsTable !== null) {

        $('#workitemdetailstable').DataTable().destroy();

        theDetailsTable = null;

        // empty in case the columns change
        $('#workitemdetailstable').empty();
    }

    theDetailsTable = $('#workitemdetailstable').DataTable({

        "ajax": {

            "type": "GET",
            "url": "./getComplianceDetails?systemID=" + systemID + "&stats=" + stats,

            "dataSrc": function (data) {

                if (data.data.length > 0) {
                    systemName = data.data[0].SYSTEM;

                    $("#compLabel").html(systemName + " - Compliance Details");

                    $("#systemsOutput").show();
                }
                return data.data;

            }
        },
        "columns": [
            { "data": "SYSTEM", title: "Information System" },
            { "data": "FAMILY", title: "Family" },
            { "data": "CONTROL", title: "Control" },
            { "data": "CONTROL_ITEM", title: "Test" },
            { "data": "TITLE", title: "Control Title" },
            { "data": "TEST_TYPE", title: "Test Type" },
            { "data": "DEPENDS_ON_SYSTEM", title: "Inherited From" },
            { "data": "STATUS", title: "Status" },
            { "data": "RESULT_DESC", title: "Result Description" },
            { "data": "EXPIRATION_DATE", title: "Expiration Date" },
            { "data": null, title: "" }]
        ,
        "columnDefs": [{
            "targets": [8],
            "visible": false,
            "searchable": false
        },
        {
            "targets": [9],
            "visible": false,
            "searchable": false
        },
        {
            "targets": [10],
            "searchable": false,
            "render": function (data, type, row, meta) {
                if ((row['STATUS'] != "Incomplete") && 
                (row['DEPENDS_ON_SYSTEM'] == "None") &&
                (row['IS_REMOTE'] == 0)) {
                    cell = `<button type="button" class="btn btn-primary">Reset</button>`
                    return cell;
                }
                return null;
            }
        },
        {
            "targets": [7],
            "render": function (data) {
                var cell = '<span class="label label-default">Unknown</span>';
                switch (data) {
                    case "Pass":
                        cell = '<span class="label label-success">Passed</span>'
                        break;
                    case "Incomplete":
                        cell = '<span class="label label-warning">Incomplete</span>'
                        break;
                    case "Fail":
                        cell = '<span class="label label-danger">Failed</span>'
                        break;
                    case "Risk Accepted":
                        cell = '<span class="label label-info">Risk Accepted</span>'
                        break;
                    default:
                        cell = '<span class="label label-default">' + data + '</span>'
                        break;
                }
                return cell
            }
        }]
    });

    $('#workitemdetailstable').on('click', 'tr td', function (e) {

        console.log("e:" + JSON.stringify(e));
        var tr = $(this).closest('tr');
        var row = theDetailsTable.row(tr);
        var data = row.data();
        var index = theDetailsTable.cell($(e.target).closest('td')).index().column;

        console.log("index:" + index);

        console.log("data:" + JSON.stringify(data));
        console.log("id:" + data.PK_WORK_ITEM_RESULT_ID);
        if (index == 10) {

            $.post('./resetWorkitemStatus', {
                "workitemID": data.PK_WORK_ITEM_RESULT_ID
            }, function (res) {

                theDetailsTable.ajax.reload(null, false);

            })

        } else {

            workItemDetailsTableSelect(data);

        }
    });
}
