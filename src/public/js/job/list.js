$(document).ready(function() {
    // use this 1 pass handler when all list items is loaded once per page load
    $('.custom-content-raw').each(function () {
        let contents = decodeEntities($(this).html());
        $(this).html(contents);
        $(this).removeClass('custom-content-raw');
    });

    // TODO: use this event handler when infinite scrolling is implemented
    // $(window).on('load resize scroll', function () {
    //     // $('.custom-content').each(function () {
    //     //     if ($(this).isInViewport()) {
    //     //         if ($(this).hasClass('custom-content-raw')) {
    //     //             let contents = decodeEntities($(this).html());
    //     //             $(this).html(contents);
    //     //             $(this).removeClass('custom-content-raw');
    //     //         }
    //     //     } 
    //     // });
    //     $('.custom-content-raw').each(function () {
    //         let contents = decodeEntities($(this).html());
    //         $(this).html(contents);
    //         $(this).removeClass('custom-content-raw');
    //     });
    // });

    $(".read-more").readMore();
});

function showSearch() {
    $("#searchModal").modal("show");
}

function submitSearch() {
    $("#searchForm").submit();
}

function resetSearchForm() {
    $("#searchTitle").val("");
    $("#searchEmployerName").val("");
    $("input:checkbox").prop("checked", false);
}

function decodeEntities(encodedString) {
    let textArea = document.createElement("textarea");
    textArea.innerHTML = encodedString;
    return textArea.value;
}
