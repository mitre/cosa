var addTestRow = function addTestRow(methods, roles, sources, systems, testMethods, rowcount, testCount, testControlItem, testDescription, testFrequency,
    testAutoEvidence, testGatheredEvidence, testCCI, testSourceEnv, testObjective, testCorrectiveAction) {

    var methodOptions;
    var methodsParse = methods;

    for (var i = 0; i < methodsParse.length; i++) {

        methodOptions += '<option value="' + methodsParse[i].PK_SYSTEM_CONTROL_TEST_PROCEDURE_TYPE_ID + '">' +
            methodsParse[i].NAME + '</option>';

    };

    /* var methods = `<% methods.forEach(function(method) {  %>
             <option value="<%= method.PK_SYSTEM_CONTROL_TEST_PROCEDURE_TYPE_ID %>">
             <%= method.NAME %>
             </option> 
         <% }) %> `;*/

    var roleOptions;
    var rolesParse = roles;

    for (var i = 0; i < rolesParse.length; i++) {

        roleOptions += '<option value="' + rolesParse[i].PK_ROLE_ID + '">' +
            rolesParse[i].NAME + '</option>';

    };

    var sourceOptions;
    var sourcesParse = sources;

    for (var i = 0; i < sourcesParse.length; i++) {

        sourceOptions += '<option value="' + sourcesParse[i].PK_TEST_SOURCE_ID + '">' +
            sourcesParse[i].NAME + '</option>';

    };

    var systemOptions;
    var systemsParse = systems;

    for (var i = 0; i < systemsParse.length; i++) {

        systemOptions += '<option value="' + systemsParse[i].PK_SYSTEM_ID + '">' +
            systemsParse[i].NAME + '</option>';

    };

    var testMethodOptions;
    var testMethodsParse = testMethods;

    for (var i = 0; i < testMethodsParse.length; i++) {

        testMethodOptions += '<option value="' + testMethodsParse[i].PK_TEST_METHOD_ID + '">' +
            testMethodsParse[i].NAME + '</option>';

    };

    var testRow = '<tr>' +
        '<td width="80%">' +
        '<div class="form-group">' +
        '<label for="inputTestStepValues' + rowCount + '" class="col-sm-2 control-label">Test #: </label>' +
        '<div class="col-sm-9">' +
        '<input type="text" class="form-control" id="inputTestStepValues' + rowCount + '" name="inputTestStepValues" value="' + rowCount + ' of ' + testCount + '" required readonly>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestControlItems' + rowCount + '" class="col-sm-2 control-label">Control Item: </label>' +
        '<div class="col-sm-9">' +
        '<input type="text" class="form-control" id="inputTestControlItems' + rowCount + '" name="inputTestControlItems" value="' + testControlItem + '" placeholder="Control item" ' +
        'required minlength="4" maxlength="45" data-validation="length" data-validation-length="4-45">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTitle' + rowCount + '" class="col-sm-2 control-label">Test Title: </label>' +
        '<div class="col-sm-9">' +
        '<input type="text" class="form-control" id="inputTitle' + rowCount + '" name="inputTitle" value="' + testTitle + '" placeholder="Test title" ' +
        'required minlength="4" maxlength="80" data-validation="length" data-validation-length="4-80">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestDescriptions' + rowCount + '" class="col-sm-2 control-label">Description: </label>' +
        '<div class="col-sm-9">' +
        '<textarea rows="5" cols="125" id="inputTestDescriptions' + rowCount + '" name="inputTestDescriptions"' +
        'placeholder="Description for test #' + rowCount + '">';

    if (testDescription != null) testRow = testRow + testDescription;

    testRow = testRow + '</textarea>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestApplicable' + rowCount + '" class="col-sm-2 control-label">Applicable: </label>' +
        '<div class="col-sm-9">' +
        '<div class="col-sm-6">' +
        '<select class="form-control" style="width: 50%" tabindex="1" aria-hidden="true" id="inputTestApplicable' + rowCount + '" name="inputTestApplicable" >' +
        '<option value="0">NO</option>' +
        '<option value="1">YES</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestMethods' + rowCount + '" class="col-sm-2 control-label">Automation Procedure: </label>' +
        '<div class="col-sm-9">' +
        '<select class="form-control" style="width: 70%" tabindex="1" aria-hidden="true" id="inputTestMethods' + rowCount + '" name="inputTestMethods" >' +
        methodOptions +
        '</select>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestFrequencies' + rowCount + '" class="col-sm-2 control-label">Frequency: </label>' +
        '<div class="col-sm-9">' +
        '<input type="text" class="form-control" id="inputTestFrequencies' + rowCount + '" name="inputTestFrequencies" ' +
        'value="';

    if (testFrequency != null) testRow = testRow + testFrequency;

    testRow = testRow + '"placeholder="Test frequency" minlength="0" maxlength="20"' +
        ' data-validation="length" data-validation-length="0-20">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestAutoEvidence' + rowCount + '" class="col-sm-2 control-label">Automatic Evidence: </label>' +
        '<div class="col-sm-10">' +
        '<input type="text" class="form-control" id="inputTestAutoEvidence' + rowCount + '" name="inputTestAutoEvidence" ' +
        'value="';

    if (testAutoEvidence != null) testRow = testRow + testAutoEvidence;

    testRow = testRow + '"placeholder="Test automatic evidence" minlength="0" maxlength="45"' +
        ' data-validation="length" data-validation-length="0-45">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestGatheredEvidence' + rowCount + '" class="col-sm-2 control-label">Gathered Evidence: </label>' +
        '<div class="col-sm-9">' +
        '<input type="text" class="form-control" id="inputTestGatheredEvidence' + rowCount + '" name="inputTestGatheredEvidence" ' +
        'value="';

    if (testGatheredEvidence != null) testRow = testRow + testGatheredEvidence;

    testRow = testRow + '"placeholder="Test gathered evidence" minlength="0" maxlength="45"' +
        ' data-validation="length" data-validation-length="0-45">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestRoles' + rowCount + '" class="col-sm-2 control-label">Role: </label>' +
        '<div class="col-sm-9">' +
        '<select class="form-control" style="width: 50%" tabindex="1" aria-hidden="true"' +
        'id="inputTestRoles' + rowCount + '" name="inputTestRoles" >' +
        roleOptions +
        '</select>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestCCI' + rowCount + '" class="col-sm-2 control-label">CCI: </label>' +
        '<div class="col-sm-9">' +
        '<input type="text" class="form-control" id="inputTestCCI' + rowCount + '" name="inputTestCCI" ' +
        'value="';

    if (testCCI != null) testRow = testRow + testCCI;

    testRow = testRow + '"placeholder="Test CCI" minlength="0" maxlength="45"' +
        ' data-validation="length" data-validation-length="0-45">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestSourceEnv' + rowCount + '" class="col-sm-2 control-label">Source Environment: </label>' +
        '<div class="col-sm-9">' +
        '<input type="text" class="form-control" id="inputTestSourceEnv' + rowCount + '" name="inputTestSourceEnv" ' +
        'value="';

    if (testSourceEnv != null) testRow = testRow + testSourceEnv;

    testRow = testRow + '"placeholder="Test source env" minlength="0" maxlength="45"' +
        ' data-validation="length" data-validation-length="0-45">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestSourceType' + rowCount + '" class="col-sm-2 control-label">Source Type: </label>' +
        '<div class="col-sm-9">' +
        '<select class="form-control" style="width: 50%" tabindex="1" aria-hidden="true"' +
        'id="inputTestSourceType' + rowCount + '" name="inputTestSourceType" >' +
        '<% sources.forEach(function(source) {  %>' +
        sourceOptions +
        '</select>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestDepends' + rowCount + '" class="col-sm-2 control-label">Inherited from: </label>' +
        '<div class="col-sm-9">' +
        '<select class="form-control" style="width: 50%" tabindex="1" aria-hidden="true" id="inputTestDepends' + rowCount + '" name="inputTestDepends">' +
        '<option value="0">NONE</option>' +
        systemOptions +
        '</select>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestTestMethod' + rowCount + '" class="col-sm-2 control-label">Test Method: </label>' +
        '<div class="col-sm-9">' +
        '<select class="form-control" style="width: 50%" tabindex="1" aria-hidden="true" id="inputTestTestMethod' + rowCount + '" name="inputTestTestMethod">' +
        testMethodOptions +
        '</select>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestObjectives' + rowCount + '" class="col-sm-2 control-label">Test Objective(s): </label>' +
        '<div class="col-sm-9">' +
        '<textarea rows="5" cols="125" id="inputTestObjectives' + rowCount + '" name="inputTestObjectives"' +
        'placeholder="Test objective(s) for test #' + rowCount + '">';

    if (testObjective != null) testRow = testRow + testObjective;

    testRow = testRow + '</textarea>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestActions' + rowCount + '" class="col-sm-2 control-label">Recommended Corrective Action(s): </label>' +
        '<div class="col-sm-9">' +
        '<textarea rows="5" cols="125" id="inputTestActions' + rowCount + '" name="inputTestActions"' +
        'placeholder="Recommended corrective action(s) for test #' + rowCount + '">';

    if (testCorrectiveAction != null) testRow = testRow + testCorrectiveAction;

    testRow = testRow + '</textarea>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestHybrid' + rowCount + '" class="col-sm-2 control-label">Hybrid Test: </label>' +
        '<div class="col-sm-9">' +
        '<select class="form-control" style="width: 50%" tabindex="1" aria-hidden="true" id="inputTestHybrid' + rowCount + '" name="inputTestHybrid" > ' +
        '<option value="0">NO</option>' +
        '<option value="1">YES</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="inputTestRuntimes' + rowCount + '" class="col-sm-2 control-label">Assess at: </label>' +
        '<div class="col-sm-9">' +
        '<select class="form-control" style="width: 50%" tabindex="1" aria-hidden="true" id="inputTestRuntimes' + rowCount + '" name="inputTestRuntimes" > ' +
        '<option value="0">BUILDTIME</option>' +
        '<option value="1">RUNTIME</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</td>' +
        '<td width="5%" align="left">' +
        '<a href="#" class="up">Up</a>' + "  " + '<a href="#" class="down">Down</a>' + "  " + '<a href="#" class="delete">Del</a>' +
        '</td>' +
        '</tr>';

    return testRow;

}

$(".up,.down").on('click', function () {
    alert("here");
    var row = $(this).parents("tr:first");
    if ($(this).is(".up")) {
        row.insertBefore(row.prev());
    } else {
        row.insertAfter(row.next());
    }
});


var addTest = function (methods, roles, sources, systems, testMethods, testsTable, rowCount) {

    var rowCount = $("#testsTable").find("tr").length;

    rowCount = Number(rowCount) + 1;

    $('#testsTable tr:last').after(addTestRow(methods, roles, sources, systems, testMethods, rowCount, rowCount, '', '', '', '', '', '', '', '', ''));

    //reset test numbers
    $('#testsTable tr').each(function (i, row) {

        $(row).find('input[name=inputTestStepValues]').val((i + 1).toString() + " of " + rowCount.toString());

    });
};

$('table').on('click', '.up', function () {
    var thisRow = $(this).closest('tr');
    var prevRow = thisRow.prev();
    var rowCount = $("#testsTable").find("tr").length;

    if (prevRow.length) {
        prevRow.before(thisRow);
    } else {
        alert("Cannot move this test up.");
    }

    // Reset test numbers
    $('#testsTable tr').each(function (i, row) {

        $(row).find('input[name=inputTestStepValues]').val((i + 1).toString() + " of " + rowCount.toString());

    });

});

$('table').on('click', '.down', function () {

    var thisRow = $(this).closest('tr');
    var nextRow = thisRow.next();
    var rowCount = $("#testsTable").find("tr").length;

    if (nextRow.length) {

        nextRow.after(thisRow);

    } else {

        alert("Cannot move this test down.");

    }

    // Reset test numbers
    $('#testsTable tr').each(function (i, row) {

        $(row).find('input[name=inputTestStepValues]').val((i + 1).toString() + " of " + rowCount.toString());

    });
});

$('table').on('click', '.delete', function (e) {

    var rowCount = $("#testsTable").find("tr").length;

    if (rowCount = 1) {

        alert("You must have at least one test.");

    } else {

        rowCount = Number(rowCount) - 1;

        $(this).closest('tr').remove();

        // Reset test numbers
        $('#testsTable tr').each(function (i, row) {

            $(row).find('input[name=inputTestStepValues]').val((i + 1).toString() + " of " + rowCount.toString());

        });
    }
})

function deleteTableRow() {

    $('table').on('click', 'input[type="button"]', function (e) {

        $(this).closest('tr').remove()

    })
}


