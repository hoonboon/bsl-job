$(document).ready(function() {
    $('.custom-content-raw').each(function () {
        let contents = decodeEntities($(this).html());
        $(this).html(contents);
        $(this).removeClass('custom-content-raw');
    });

    $(".read-more").readMore();
});

function decodeEntities(encodedString) {
    let textArea = document.createElement("textarea");
    textArea.innerHTML = encodedString;
    return textArea.value;
}