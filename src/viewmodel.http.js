// Shelby._ViewModel.Http
// ---------------------------------

(function(extend, utils) {
    "use strict";

    Shelby._ViewModel.Http = {
        _url: null,

        _send: function(options, handlers) {
            if (utils.isNullOrEmpty(options.request.url)) {
                throw new Error("\"options.request.url\" must be a non null or empty string.");
            }
        
            var that = this;

            var request = $.extend({ context: this }, options.request);
            var operationContext = new Shelby.OperationContext(request);

            if ($.isFunction(handlers.onBefore)) {
                request.beforeSend = function() {
                    // Prepend original arguments with the operation context.
                    var args = $.makeArray(arguments);
                    args.unshift(operationContext);
                    
                    // The original jQuery AJAX "beforeSend" function support returning "false" to abort the
                    // request, allow a return value to support that behaviour.
                    return handlers.onBefore.apply(this, args);
                };
            }

            // Convert the request data from observables to plain objects.
            if (utils.isObject(request.data)) {
                request.data = this._toJS(request.data);
            }

            // Execute the AJAX request.
            var promise = Shelby.components.ajax().send(request);

            // Using a "proxy" deferred to add custom mapping / error handling logics through 
            // the AJAX promise handlers.
            var deferred = $.Deferred();

            promise.done(function(response) {
                if (!utils.isNull(response)) {
                    options.response = options.response || {};

                    // If the caller did NOT specify to NOT process the response, process the response. 
                    if (options.response.process !== false) {
                        if ($.isFunction(options.response.extractor)) {
                            response = options.response.extractor.call(this, response);
                        }

                        if ($.isFunction(handlers.onResponse)) {
                            response = handlers.onResponse.apply(that, [response, options]);
                        }
                    }
                }
            
                deferred.resolveWith(this, [response]);

                if ($.isFunction(that._handleOperationSuccess)) {
                    that._handleOperationSuccess.call(this, operationContext);
                }
            });

            promise.fail(function(jqxhr, textStatus) {
                var error = new Shelby.RequestError(operationContext, jqxhr, textStatus);
                
                deferred.rejectWith(this, [error]);

                if ($.isFunction(that._handleOperationError)) {
                    that._handleOperationError.call(this, error);
                }
            });

            if ($.isFunction(handlers.onAfter)) {
                promise.always(function() {
                    // Convert arguments array like to an actual array and prepends with the operation context.
                    var args = $.makeArray(arguments);
                    args.unshift(operationContext);

                    handlers.onAfter.apply(this, args);
                });
            }
            
            return deferred.promise();
        },

        _fetch: function(options) {
            if (utils.isNull(options)) {
                throw new Error("\"options\" must be a non null object literal.");
            }

            if (utils.isNull(options.request)) {
                throw new Error("\"options.request\" must be a non null object literal.");
            }

            options.request.type = options.request.type || "GET";

            return this._send(options, {
                onBefore: this._beforeFetch,
                onAfter: this._afterFetch,
                onResponse: function(response) {
                    // Convert the response properties to observables.
                    return this._fromJS(response, options.response.mapping);
                }
            });
        },

        _save: function(options) {
            if (utils.isNull(options)) {
                throw new Error("\"options\" must be a non null object literal.");
            }

            if (utils.isNull(options.request)) {
                throw new Error("\"options.request\" must be a non null object literal.");
            }

            if (utils.isNullOrEmpty(options.request.type)) {
                throw new Error("\"options.request.type\" must be a non nullor empty string.");
            }

            return this._send(options, {
                onBefore: this._beforeSave,
                onAfter: this._afterSave,
                onResponse: function(response, requestOptions) {
                    if (utils.isObject(requestOptions.request.data) && utils.isObject(response)) {
                        Shelby.components.mapper().update(requestOptions.request.data, response);
                    }

                    return response;
                }
            });
        },

        _remove: function(options) {
            if (utils.isNull(options)) {
                throw new Error("\"options\" must be a non null object literal.");
            }

            if (utils.isNull(options.request)) {
                throw new Error("\"options.request\" must be a non null object literal.");
            }

            options.request.type = options.request.type || "DELETE";

            return this._send(options, {
                onBefore: this._beforeSave,
                onAfter: this._afterSave
            });
        },
        
        all: function(criteria, options) {
            var url = this._getUrl("all");

            var requestOptions = {
                request: {
                    url: url.value,
                    data: criteria
                },
                response: options
            };

            return this._fetch($.extend({}, requestOptions, options));
        },
        
        detail: function(id, options) {
            if (utils.isNullOrEmpty(id)) {
                throw new Error("\"id\" must be a non null or empty string.");
            }

            var url = this._getUrl("detail");

            var requestOptions = {
                request: {
                    url: url.value,
                    data: {
                        id: id
                    }
                }
            };

            return this._fetch($.extend(requestOptions, options));
        },

        add: function(model, options) {
            if (utils.isNull(model)) {
                throw new Error("\"model\" must be a non null object.");
            }

            var url = this._getUrl("add");

            var requestOptions = {
                request: {
                    url: url.value,
                    type: "POST",
                    data: model
                }
            };

            return this._save($.extend(requestOptions, options));
        },

        update: function(/* [id], model, [options] */) {
            var id = null;
            var model = null;
            var options = null;
            var url = this._getUrl("update");
            var isRest = url.type === UrlType.Rest;

            if (isRest) {
                switch (arguments.length) {
                    case 3:
                        id = arguments[0];
                        model = arguments[1];
                        options = arguments[2];
                        break;
                    case 2:
                        if (utils.isString(arguments[0])) {
                            id = arguments[0];
                            model = arguments[1];
                        }
                        else {
                            model = arguments[0];
                            options = arguments[1];
                        }
                        break;
                    default:
                        model = arguments[0];
                        break;
                }
            }
            else {
                model = arguments[0];
                options = arguments[1];
            }

            if (utils.isNull(model) || !utils.isObject(model)) {
                throw new Error("\"model\" must be a non null object.");
            }

            if (isRest && utils.isString(id)) {
                url.value = utils.stringFormat("{1}/{2}", url.value, id);
            }

            var requestOptions = {
                request: {
                    url: url.value,
                    type: isRest ? "PUT" : "POST",
                    data: model
                }
            };

            return this._save($.extend(requestOptions, options));
        },

        remove: function(target, options) {
            var url = this._getUrl("remove");
            var isRest = url.type === UrlType.Rest;

            if (isRest) {
                if (utils.isString(target)) {
                    if (utils.isNullOrEmpty(target)) {
                        throw new Error("\"target\" id must be a non empty string.");
                    }

                    url.value = utils.stringFormat("{1}/{2}", url.value, target);
                } 
                else if (!utils.isObject(target)) {
                    throw new Error("\"target\" must be a non null or empty string identifier or a non null object model.");
                }
            }

            var requestOptions = {
                request: {
                    url: url.value,
                    type: isRest ? "DELETE" : "POST",
                    data: utils.isObject(target) ? target : null
                }
            };

            return this._remove($.extend(requestOptions, options));
        },
        
        _getUrl: function(operation) {
            if (!utils.isNullOrEmpty(this._url)) {
                // When the URL is a string, we consider that your endpoint expose a RESTful API
                // otherwise if it is an object, we consider it expose an RPC API.
                if (utils.isString(this._url)) {
                    return {
                        value: this._url,
                        type: UrlType.Rest
                    };
                }
                else if (utils.isObject(this._url)) {
                    var url = this._url[operation];
                    
                    if (utils.isNullOrEmpty(url)) {
                        throw new Error(utils.stringFormat("The URL for the operation \"{1}\" is not specified.", operation));
                    }
                    
                    return {
                        value: url,
                        type: UrlType.Rpc
                    };
                }
            }
            
            throw new Error("To use any of the AJAX operations, the \"_url\" property must be a non-null/empty string or a non-null object literal.");
        }
    };

    // ---------------------------------

    var UrlType = Shelby.UrlType = {
        Rest: "REST",
        Rpc: "RPC"
    };
})(Shelby.extend,
   Shelby.utils);