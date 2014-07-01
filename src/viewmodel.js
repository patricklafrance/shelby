// Shelby.ViewModel
// ---------------------------------

(function(namespace, extend, utils, factory) {
    Shelby.ViewModel = function() {
        this.element = null;
    };
    
    Shelby.ViewModel.prototype = {
        // Must be override by you to support REST or RPC HTTP requests for 
        // "all" / "detail" / "add" / "update" / "remove" functions. 
        // For REST requests, "_url" must be a string representing the endpoint URL.
        // For RPC requests, "_url" must be an object literal having the following structure:
        //  - all: "ALL_URL",
        //  - detail: "DETAIL_URL",
        //  - add: "ADD_URL",
        //  - update: "UPDATE_URL",
        //  - remove: "REMOVE_URL"
        _url: null,
    
        // Proxy constructor function that should be override by you. 
        // If defined, it will be invoked when the model is created after all the 
        // initialization logic is done.
        _initialize: null,
    
        // If defined by you, it will be invoked before binding the view model with the DOM. 
        // By default, the bindings will be applied after your handler execution, if you want to do asynchronous
        // operations your handler function must return true and then call the callback function parameter 
        // when your operations are completed.
        //  - callback: A function that you can call when your asynchronous operations are completed.
        _beforeBind: null,
        _beforeFetch: null,
        _beforeSave: null,
        _beforeRemove: null,

        _afterBind: null,
        _afterFetch: null,
        _afterSave: null,
        _afterRemove: null,
        
        // If defined by you, it will be invoked when an handled error occurs.
        //  - data: An object literal having the following structure:
        //    - data: The error data, it can be of any types depending of the source of the error.
        //    - operationContext: An object literal thats represents the current operation. The type of the operation can be identified 
        //      with the property "type" and will match a value of the "Shelby.ViewModel.OperationType" enumeration.
        //      The object structure will be:
        //        - if "type" is Shelby.ViewModel.OperationType.AJAX: see "_createAjaxOperationContext" for the object structure.
        //      In addition to the operation context standard option, in case of an error the following properties are added to the operation context:
        //       - statusCode: The request status code (404, 501, ...).
        //       - statusText: The request status text.
        //       - exception: Any source of exception. Possible values are: null, "timeout", "error", "abort", or "parsererror".
        _handleOperationError: null,

        _handleOperationSuccess: null,
        
        // If defined by you, it will be invoked when disposing the view model.
        _handleDispose: null,

        // Apply the KO bindings with the view model.
        //  - element : a DOM or jQuery element to use as the root.
        bind: function(element) {
            var that = this;
            var deferred = new $.Deferred();

            var applyBindings = function() {
                that._applyBindings();
                deferred.resolve();
            };
		
            this.element = this._getDomElement(element);
            
            if ($.isFunction(this._beforeBind)) {
                var isAsync = this._beforeBind.call(this, applyBindings);
				
                if (isAsync !== true) {
                    applyBindings();
                }
            }
            else {
                applyBindings();
            }
			
            return deferred.promise();
        },
        
        _getDomElement: function(element) {
            if (utils.isjQueryElement(element) && element.length > 0) {
                element = element[0];
            }
            
            return element;
        },
        
        _applyBindings: function() {
            ko.applyBindings(this, this.element);
            
            if ($.isFunction(this._afterBind)) {
                this._afterBind.call(this);
            }
        },
        
        _fromJS: function(obj, options) {
            // Convert properties to observables.
            var mapped = factory.mapper().fromJS(obj, options);
            
            // Extend all the properties.
            this._addExtenders(mapped);
            
            return mapped;
        },
        
        _toJS: function(obj) {
            // Convert observables back to primitive values.
            var unmapped = factory.mapper().toJS(obj);
            
            // Remove all extenders left on the properties (ex. on objects).
            this._removeExtenders(unmapped);
            
            return unmapped;
        },

        _addExtenders: function(obj) {
            if (utils.objectSize(this._extenders) > 0) {
                factory.propertyExtender().add(obj, this._extenders);
            }
        },
        
        _removeExtenders: function(obj) {
            factory.propertyExtender().remove(obj);
        },

        _send: function(options, handlers) {
            if (utils.isNullOrEmpty(options.request.url)) {
                throw new Error("\"options.request.url\" must be a non null or empty string.");
            }
        
            var that = this;

            var request = $.extend({ context: this }, options.request);
            var operationContext = this._createOperationContext(request);

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
            var promise = factory.ajax().send(request);

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
                var error = that._createRequestErrorData(operationContext, jqxhr, textStatus);
                
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
                        factory.mapper().update(requestOptions.request.data, response);
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
        
        dispose: function() {
            var action = function(property) {
                if (utils.hasProperty(property.value, namespace) && utils.hasProperty(property.value[namespace], "unsuscribeAll")) {
                    property.value[namespace].unsuscribeAll();
                }
            };
        
            // Iterate on the view model properties to dispose all the subscriptions.
            factory.parser().parse(this, {
                filter: factory.filters().getExtendedPropertyFilter(),
                onObject: action
            });
            
            if (utils.isDomElement(this.element)) {
                // Clean the KO bindings on the specified DOM element.
                if (ko.dataFor(this.element)) {
                    ko.cleanNode(this.element);
                }
            }
            
            if ($.isFunction(this._handleDispose)) {
                this._handleDispose.call(this);
            }

            /* jshint -W051 */
            delete this;
            /* jshint +W051 */
        },
        
        // Create a new operation context with the following structure:
        //  - url: The request URL.
        //  - method: The operation method.
        //  - data: The request data.
        _createOperationContext: function(request) {
            return {
                url: request.url,
                method: this._getOperationMethod(request.type),
                data: request.data
            };
        },
        
        _createRequestErrorData: function(operationContext, jqxhr, textStatus) {
            var data = null;
            
            if (!utils.isNull(jqxhr.responseJSON)) {
                data = jqxhr.responseJSON;
            }
            else if (!utils.isNull(jqxhr.responseXML)) {
                data = jqxhr.responseXML;
            }
            else {
                data = jqxhr.responseText;
            }
            
            operationContext.statusCode = jqxhr.status;
            operationContext.statusText = jqxhr.statusText;
            operationContext.exception = textStatus;
        
            return {
                data: data,
                operationContext: operationContext
            };
        },

        _getOperationMethod: function(httpVerb) {
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

    Shelby.ViewModel.prototype._extenders = {
        "*": {
            "utility": Shelby.Extenders.utility,
            "subscribe": Shelby.Extenders.subscribe,
            "edit": Shelby.Extenders.edit
        }
    };

    var UrlType = Shelby.ViewModel.UrlType = {
        Rest: "REST",
        Rpc: "RPC"
    };
    
    var OperationMethod = Shelby.ViewModel.OperationMethod = {
        Get: "GET",
        Post: "POST",
        Put: "PUT",
        Delete: "DELETE"
    };
    
    Shelby.ViewModel.extend = extend;
})(Shelby.namespace, 
   Shelby.extend, 
   Shelby.utils, 
   Shelby.Factory.instance);

