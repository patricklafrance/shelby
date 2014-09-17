// Shelby.Ajax
// ---------------------------------

(function(debug, extend, utils) {
    var Ajax = Shelby.Ajax = function() {
    };

    Ajax.prototype = {
        // Send an AJAX request.
        //  - options: Any jQuery AJAX options (http://api.jquery.com/jQuery.ajax),
        //    options "url" and "type" are mandatory.
        send: function(options) {
            if (utils.isNull(options)) {
                throw new Error("\"options\" must be a non null object literal.");
            }

            if (utils.isNullOrEmpty(options.url)) {
                throw new Error("\"options.url\" must be a non null or empty string.");
            }

            if (utils.isNullOrEmpty(options.type)) {
                throw new Error("\"options.type\" must be a non null or empty string.");
            }
            
            var mergedOptions = $.extend({}, $.ajaxSettings, Ajax.options, options);
            var hasData = utils.isObject(options.data);

            if (!hasData) {
                mergedOptions.contentType = null;
            }
                
            if (options.type !== "GET" && hasData) {
                if (utils.stringContains(mergedOptions.contentType, "application/json")) {
                    mergedOptions.data = JSON.stringify(mergedOptions.data);
                }
            }

            var jqxhr = $.ajax(mergedOptions);
            
            if (debug === true) {
                jqxhr.fail(this._onRequestFail);
            }
            
            return jqxhr;
        },
        
        _onRequestFail: function(jqxhr, textStatus, errorThrown) {          
            var data = utils.isNullOrEmpty(this.data) ? "{NO_DATA}" : JSON.stringify(this.data);
            var exception = utils.isNullOrEmpty(textStatus) ? "{NO_EXCEPTION}" : textStatus;
            var httpError = utils.isNullOrEmpty(errorThrown) ? "{NO_HTTP_ERROR}" : errorThrown;
            
            var message = utils.stringFormat(
                "An error occurred while performing an AJAX request of type {1} to {2} with data {3}.\nStatus code: {4}\nStatus " + 
                "text: {5}\nException: {6}\nHTTP error: {7}",
                this.type, 
                this.url, 
                data, 
                jqxhr.status, 
                jqxhr.statusText, 
                exception, 
                httpError);
            
            utils.debug(message);
        }
    };

    // By defaults the options are the jQuery AJAX default settings (http://api.jquery.com/jQuery.ajax)
    // with a few exceptions:
    //  - Requests are made using the JSON format.
    //  - Caching is disabled.
    Ajax.options = $.extend({}, $.ajaxSettings, {
        contentType: "application/json",
        cache: false
    });
    
    Ajax.extend = extend;

    // Register the components.
    Shelby.Components.registerComponent("ajax", function() {
        return new Ajax();
    });
})(Shelby.debug,
   Shelby.extend, 
   Shelby.utils);