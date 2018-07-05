// Usage
// $.cachedScript( "ajax/test.js" ).done(function( script, textStatus ) {
//   console.log( textStatus );
// });
jQuery.cachedScript = function( url, success, options ) {
 
  // Allow user to set any option except for dataType, cache, and url
  options = $.extend( options || {}, {
    dataType: "script",
    cache: true,
    url: url,
    success: success
  });
 
  // Use $.ajax() since it is more flexible than $.getScript
  // Return the jqXHR object so we can chain callbacks
  return jQuery.ajax( options );
};

$(document).ready(function () {
  $(document).on("click", 'a[href="#"]', function (e) {
    e.preventDefault();
  });

  if (fb_app_id) {
    $.cachedScript('https://connect.facebook.net/en_US/sdk.js', function(){
      FB.init({
        appId: fb_app_id,
        cookie : true,
        xfbml: true,
        version: 'v3.0'
      });

      // page level analytics tracking
      FB.AppEvents.logPageView(); 
    });
  }

  // Place JavaScript code here...

});

// Utility method for analytics tracking - job view event only
function track(url, jobId) {
  // Facebook Analytics
  if (fb_app_id) {
    var params = {};
    params[FB.AppEvents.ParameterNames.CONTENT_ID] = jobId;
    // log event
    FB.AppEvents.logEvent(
      FB.AppEvents.EventNames.VIEWED_CONTENT,
      null,  // numeric value for this event - in this case, none
      params
    );
  }
  
  // Google Analytics
  if (ga_tracking_id) {
    // log event
    if (jobId)
      gtag('event', 'view_job', { 'event_category': 'engagement', 'event_label': jobId });
  }
}