(function() {
  "use strict";
  var endpoint = document.currentScript && document.currentScript.getAttribute("data-endpoint");
  var tenantId = document.currentScript && document.currentScript.getAttribute("data-tenant");
  if (!endpoint || !tenantId) return;

  function getDevice() {
    var ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) return "mobile";
    if (/Tablet|iPad/i.test(ua)) return "tablet";
    return "desktop";
  }

  function track() {
    var data = {
      tenantId: tenantId,
      page: location.pathname,
      referrer: document.referrer || undefined,
      device: getDevice()
    };
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint + "/api/analytics/track", JSON.stringify(data));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint + "/api/analytics/track", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(data));
    }
  }

  // Track initial page load
  track();

  // Track SPA navigation (pushState)
  var origPushState = history.pushState;
  history.pushState = function() {
    origPushState.apply(this, arguments);
    track();
  };
  window.addEventListener("popstate", track);
})();
