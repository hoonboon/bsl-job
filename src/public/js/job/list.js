$(document).ready(function() {
    // use this 1 pass handler when all list items is loaded once per page load
    $('.custom-content-raw').each(function () {
        let contents = decodeEntities($(this).html());
        $(this).html(contents);
        $(this).removeClass('custom-content-raw');
    });

    $('.locationOptionLabel').click(function() {
        updateSearchLocationDisplay();
    })

    updateSearchLocationDisplay();

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

function updateSearchLocationDisplay() {
    let displayValue = "";
    $('.locationOptionLabel').each(function() {
        const checked = $('input', this).is(':checked');
        if (checked) {
            if (displayValue == "") {
                displayValue = $('span', this).text();
            } else {
                displayValue += ", " + $('span', this).text();
            }
        }
    })
    $("#searchLocationDisplay").val(displayValue);
}

function submitViewList() {
    $("#searchForm").submit();
}

function resetSearchForm() {
    $("#searchTitle").val("");
    $("#searchLocationDisplay").val("");
    $("input:checkbox").prop("checked", false);
}

function decodeEntities(encodedString) {
    let textArea = document.createElement("textarea");
    textArea.innerHTML = encodedString;
    return textArea.value;
}
