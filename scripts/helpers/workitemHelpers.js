var evidence_dataTable = $('#evidenceUploadsTable').DataTable({
    "data": null,
    "columns": [
        {
            "data": "FILE",
            "render": function (data) {
                console.log(JSON.stringify(data));
                return '<input type="checkbox" name="id[]" value="' + data + '"><a href=#>  ' + data + '</a>';
            }
        }],
    "searching": false,
    "lengthChange": false,
    "language": {
        "emptyTable": "No attachments"
    },
    'rowCallback': function (row, data, dataIndex) {
        // Get row ID
        var rowId = data[0];

        // If row ID is in the list of selected row IDs
        if ($.inArray(rowId, rows_selected) !== -1) {
            $(row).find('input[type="checkbox"]').prop('checked', true);
            $(row).addClass('selected');
        }
    }
});

var rows_selected = [];

$('#evidenceUploadsTable tbody').on('click', 'input[type="checkbox"]', function (e) {

    var $row = $(this).closest('tr');

    console.log("row " + JSON.stringify($row));

    // Get row data
    var data = evidence_dataTable.row($row).data();
    console.log("data " + JSON.stringify(data));

    // Get row ID
    var rowId = $row[0]._DT_RowIndex;
    console.log("rowId " + rowId);

    // Determine whether row ID is in the list of selected row IDs 
    var index = $.inArray(rowId, rows_selected);

    // If checkbox is checked and row ID is not in list of selected row IDs
    if (this.checked && index === -1) {
        rows_selected.push(rowId);

        // Otherwise, if checkbox is not checked and row ID is in list of selected row IDs

    } else if (!this.checked && index !== -1) {
        rows_selected.splice(index, 1);
    }

    if (this.checked) {
        $row.addClass('selected');
    } else {
        $row.removeClass('selected');
    }

    if (rows_selected.length == 0) {

        $('#btnDeleteFiles').hide();
        $('#btnDownloadFiles').hide();

    } else {

        $('#btnDeleteFiles').show();
        $('#btnDownloadFiles').show();

    }

    // Update state of "Select all" control
    //updateDataTableSelectAllCtrl(evidence_dataTable);

    // Prevent click event from propagating to parent
    e.stopPropagation();

    console.log(JSON.stringify(rows_selected));

});

// Handle click on table cells with checkboxes
$('#evidenceUploadsTable').on('click', 'tbody td, thead th:first-child', function (e) {
    $(this).parent().find('input[type="checkbox"]').trigger('click');
});

// Handle table draw event
evidence_dataTable.on('draw', function () {
    // Update state of "Select all" control
    //    updateDataTableSelectAllCtrl(evidenceUploadsTable);
});

function handleFileSelect(evt) {

    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function (theFile) {

            return function (e) {

                // Render thumbnail.
                var span = document.createElement('span');
                span.innerHTML = ['<div><img class="thumb" src="', e.target.result,
                    '" title="', escape(theFile.name), '"/></div>'].join('');
                document.getElementById('filelist').insertBefore(span, null);

            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);

    }
}

document.getElementById('uploadFiles').addEventListener('change', handleFileSelect, false);

$("#btnDownloadFiles").click(function (event) {

    var evidence;
    var selection;

    console.log("Download files: " + JSON.stringify(rows_selected));

    for (var i = 0; i < rows_selected.length; i++) {

        selection = rows_selected[i];

        evidence = evidence_dataTable.row(selection).data();

        console.log("Evidence: " + JSON.stringify(evidence));

        setTimeout(function (path) {
            window.location = "/workitems/getEvidenceFiles?evidenceFile=" + path
                //+ "&systemName=" + systemName
                + "&workitemId=" + workitemId;
        }, 200 + i * 200, evidence.FILE);

    }
});

$("#btnDeleteFiles").click(function (event) {

    var evidence;
    var selection;

    for (var i = 0; i < rows_selected.length; i++) {

        selection = rows_selected[i];

        evidence = evidence_dataTable.row(selection).data();

        $.post("./deleteEvidenceFile", {
            "workitemId": workitemId,
            "systemName": systemName,
            "evidenceFile": evidence.FILE
        },
            function (data, status) {

                console.log(data); // 1 record updated

                if (data != 'Success') alert(data);

                location.reload();

            });
    }

    alert("Done with delete operation.");

});