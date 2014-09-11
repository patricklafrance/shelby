// Shelby._ViewModel.HttpEvent
// ---------------------------------

(function(utils) {
    "use strict";

    Shelby._ViewModel.HttpEvent = {
        _beforeFetch: null,
        _beforeSave: null,
        _beforeRemove: null,
        _afterFetch: null,
        _afterSave: null,
        _afterRemove: null,

        _handleOperationError: null,
        _handleOperationSuccess: null
    };

    // ---------------------------------
    
    var OperationMethod = Shelby.OperationMethod = {
        Get: "GET",
        Post: "POST",
        Put: "PUT",
        Delete: "DELETE",

        fromHttpVerb: function(httpVerb) {
            var method = OperationMethod.Get;

            if (httpVerb === "POST") {
                method = OperationMethod.Post;
            }
            else if (httpVerb === "PUT") {
                method = OperationMethod.Put;
            }
            else if (httpVerb === "DELETE") {
                method = OperationMethod.Delete;
            }

            return method;
        }
    };

    // ---------------------------------

    Shelby.OperationContext = function(request) {
        this.url = request.url;
        this.method =  OperationMethod.fromHttpVerb(request.type);
        this.data = request.data;
    };

    // ---------------------------------

    Shelby.RequestError = function(operationContext, jqxhr, textStatus) {
        var response = null;
        
        if (!utils.isNull(jqxhr.responseJSON)) {
            response = jqxhr.responseJSON;
        }
        else if (!utils.isNull(jqxhr.responseXML)) {
            response = jqxhr.responseXML;
        }
        else {
            response = jqxhr.responseText;
        }
        
        operationContext.statusCode = jqxhr.status;
        operationContext.statusText = jqxhr.statusText;
        operationContext.exception = textStatus;
    
        this.operationContext = operationContext;
        this.response = response;
    };
})(Shelby.utils);