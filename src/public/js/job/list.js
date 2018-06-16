$(document).ready(function() {

});

function showSearch() {
    $("#searchModal").modal("show");
}

function submitSearch() {
    $("#searchForm").submit();
}

function decodeEntities(encodedString) {
    let textArea = document.createElement("textarea");
    textArea.innerHTML = encodedString;
    return textArea.value;
}

function view(id) {
    $.getJSON("/job/" + id)
    .done(function(json) {
        let job = json.job;
        $("#modal-title").html(job.title);

        if (job.customContent && job.customContent !== "") {
            let contents = decodeEntities(job.customContent);
            $("#customContent").html(contents);
            $("#customContent").show();
            $("#standardContent").hide();
        } else {
            $("#job-title").html(job.title);
            $("#job-description").html(job.description);
            $("#job-employer-name").html(job.employer.name);
            $("#job-employer-contact").html(job.employer.contact);
            $("#job-salary").html(job.salary);
            $("#job-empType").html(job.empType);
            $("#job-language").html(job.language);
            $("#job-location").html(job.location);
            $("#job-closing").html(job.closing);
            $("#job-otherInfo").html(job.otherInfo);
            $("#customContent").hide();
            $("#standardContent").show();
        }
        $("#previewModal").modal("show");
    })
    .fail(function(jqxhr, textStatus, error ) {
        alert("Unexpected error. Please try again later.");
    })
    .always(function() {
        // do nothing
    });
}
