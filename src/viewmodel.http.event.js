// Shelby._ViewModel.HttpEvent
// ---------------------------------

(function(utils) {
    function call(handler, args) {
        if ($.isFunction(handler)) {
            /* jshint -W040 */
            handler.apply(this, args);
            /* jshint +W040 */
        }
    }

    Shelby._ViewModel.HttpEvent = {
        _beforeFetch: null,
        _beforeSave: null,
        _beforeRemove: null,
        _afterFetch: null,
        _afterSave: null,
        _afterRemove: null,

        _handleOperationError: null,
        _handleOperationSuccess: null,

        _notify: function(eventName, args) {
            switch (eventName) {
                case HttpEvent.BeforeFetch:
                    call(this._beforeFetch, args);
                    break;
                case HttpEvent.BeforeSave:
                    call(this._beforeSave, args);
                    break;
                case HttpEvent.BeforeRemove:
                    call(this._beforeRemove, args);
                    break;
                case HttpEvent.AfterFetch:
                    call(this._afterFetch, args);
                    break;
                case HttpEvent.AfterSave:
                    call(this._afterSave, args);
                    break;
                case HttpEvent.AfterRemove:
                    call(this._afterRemove, args);
                    break;
                case HttpEvent.OperationError:
                    call(this._handleOperationError, args);
                    break;
                case HttpEvent.OperationSuccess:
                    call(this._handleOperationSuccess, args);
                    break;
            }

            Shelby.Components.eventManager().notifyHandlers(eventName, args, this);
        }
    };

    // ---------------------------------

    var HttpEvent = Shelby.HttpEvent = {
        BeforeFetch: "beforeFetch",
        BeforeSave: "beforeSave",
        BeforeRemove: "beforeRemove",
        AfterFetch: "afterFetch",
        AfterSave: "afterSave",
        AfterRemove: "afterRemove",
        OperationError: "operationError",
        OperationSuccess: "operationSuccess"
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