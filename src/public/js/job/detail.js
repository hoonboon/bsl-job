$(document).ready(function() {
    $('.custom-content-raw').each(function () {
        let contents = decodeEntities($(this).html());
        $(this).html(contents);
        $(this).removeClass('custom-content-raw');
    });

    $("body").addClass("no-select");
});

function decodeEntities(encodedString) {
    let textArea = document.createElement("textarea");
    textArea.innerHTML = encodedString;
    return textArea.value;
}