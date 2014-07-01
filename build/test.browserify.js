(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = jQuery;
},{}],2:[function(require,module,exports){
module.exports = ko;
},{}],3:[function(require,module,exports){
(function (global){
(function(factory) {
    "use strict";
    
    if (typeof require === "function") {
        var instance = factory(require("jquery"), require("knockout"));

        // CommonJS
        if (typeof exports === "object") {
            exports = instance;
        }

        // Node.js and Browserify
        if (typeof module === "object") {
            module.exports = instance;
        }
    }
    else if (typeof define === "function" && define.amd) {
        // Register as a named AMD module.
        define("shelby", [
            "jquery",
            "knockout"
        ], factory);
    } 
    else {
        var target = window || global;

        // Expose as a global object.
        window.Shelby = factory(window.jQuery, window.ko);
    }
})(function($, ko) {
    "use strict";

/* jshint -W079 */
var Shelby = {};
/* jshint +W079 */

// Current version.
Shelby.version = "0.2.0";

// All extensions are added into a custom "shelby" namespace to avoid poluating the 
// root of objects or observables.
Shelby.namespace = "shelby";

// When true, additional informations will be output to the console.
Shelby.debug = false;

// Utils
// ---------------------------------

(function(namespace, undefined) {
    var objectHasOwnPropertySupported = $.isFunction(Object.hasOwnProperty);
    var objectKeysSupported = $.isFunction(Object.keys);
    var arrayIndexOfSupported = $.isFunction(Array.prototype.indexOf);
    var arrayMapSupported = $.isFunction(Array.prototype.map);
        
    var currentGuid = 0;
    
    Shelby.utils = {
        isUndefined: function(value) {
            return value === undefined;
        },
        
        isNull: function(value) {
            return this.isUndefined(value) || value === null;
        },
        
        isNullOrEmpty: function(value) {
            return this.isNull(value) || value === "";
        },
        
        isString: function(value) {
            return Object.prototype.toString.call(value) === "[object String]";
        },
        
        isObject: function(value) {
            if ($.isFunction(value) || $.isArray(value)) {
                return false;
            }
        
            return value === Object(value);
        },
        
        isjQueryElement: function(value) {
            return value instanceof jQuery;
        },

        isDomElement: function(value) {
            try {
                if (value.ownerDocument.documentElement.tagName.toLowerCase() === "html") {
                    return true;
                }
            }
            catch (e) {
            }

            return false;
        },
        
        // Custom hasOwnProperty function providing a fallback if the original function
        // is not available for the current browser.
        /* jshint -W001 */
        hasOwnProperty: function(obj, key) {
            if (!objectHasOwnPropertySupported) {
                return key in obj;
            }
            
            return obj.hasOwnProperty(key);
        },
        /* jshint +W001 */
        
        hasProperty: function(obj, key) {
            return key in obj;
        },
        
        clonePlainObject: function(obj) {
            return $.extend(true, {}, obj);
        },
        
        cloneArray: function(array) {
            return array.slice(0);
        },
        
        // Custom array indexOf function providing a fallback if the original function
        // is not available for the current browser and add support for a comparer to handle 
        // complex type.
        arrayIndexOf: function(array, value, comparer, context) {
            if (!arrayIndexOfSupported || comparer) {
                if (this.isNull(comparer)) {
                    comparer = function(current) {
                        return current === value;
                    };
                }
            
                for (var i = 0, max = array.length; i < max; i += 1) {
                    if (comparer.apply(context, [array[i], value]) === true) {
                        return i;
                    }
                }
                
                return -1;
            }
            
            return array.indexOf(value);
        },
        
        arrayGetValue: function(array, value, comparer) {
            var index = this.arrayIndexOf(array, value, comparer);
            
            if (index !== -1) {
                return array[index];
            }
            
            return null;
        },
        
        arrayRemoveIndex: function(array, index) {
            array.splice(index, 1);
        },
        
        arrayRemoveValue: function(array, value, comparer) {
            var index = this.arrayIndexOf(array, value, comparer);
            
            if (index !== -1) {
                this.arrayRemoveIndex(array, index);
            }
        },

        arrayClear: function(array) {
            while (array.length > 0) {
                array.pop();
            }
        },
        
        arrayMap: function(array, mapper, context) {
            if (!arrayMapSupported) {
                var mapped = [];
            
                for (var i = 0, max = array.length; i < max; i += 1) {
                    mapped.push(mapper.apply(context, [array[i], i, array]));
                }
                
                return mapped;
            }

            return array.map(mapper, context);
        },
        
        arrayMapToObject: function(array, keyProperty, valueProperty) {
            var obj = {};
        
            for (var i = 0, max = array.length; i < max; i += 1) {
                obj[array[i][keyProperty]] = array[i][valueProperty];
            }
            
            return obj;
        },
        
        objectMap: function(obj, mapper, context) {
            var mappedObject = {};
            
            for (var key in obj) {
                if (this.hasOwnProperty(obj, key)) {
                    mappedObject[key] = mapper.apply(context, [obj[key], key, obj]);
                }
            }
            
            return mappedObject;
        },
        
        objectKeys: function(obj) {
            if (!objectKeysSupported) {
                var propertyKeys = [];
            
                for (var key in obj) {
                    if (this.hasOwnProperty(obj, key)) {
                        propertyKeys.push(key);
                    }
                }
                
                return propertyKeys;
            }
            
            return Object.keys(obj);
        },
        
        objectSize: function(obj) {
            return this.objectKeys(obj).length;
        },
        
        isImplementing: function(obj, properties) {
            if (properties.length === 0) {
                return false;
            }
        
            for (var i = 0, max = properties.length; i < max; i += 1) {
                if (!(properties[i] in obj)) {
                    return false;
                }
            }
            
            return true;
        },
        
        isPartiallyImplementing: function(obj, properties) {
            for (var i = 0, max = properties.length; i < max; i += 1) {
                if (properties[i] in obj) {
                    return true;
                }
            }
            
            return false;
        },

        isImplementingShelby: function(obj) {
            return this.hasProperty(obj, namespace);
        },
        
        // Tokens start at index 1. Ex. {1}, {2}...
        stringFormat: function() {
            var args = arguments;
            var str = args[0];

            return str.replace(/\{(\d+)\}/g, function(m, n) {
                return args[n];
            });
        },

        stringContains: function(str, value) {
            return str.indexOf(value) !== -1;
        },
        
        stringEndsWith: function(str, value) {
            return str.indexOf(value, str.length - value.length) !== -1;       
        },
        
        stringEnsureEndsWith: function(str, value) {
            return this.stringEndsWith(str, value) ? str : (str + value);
        },
        
        debug: function(message) {
            if (!this.isNull(console.log)) {
                console.log(message);
            }
            else {
                throw new Error(message);
            }
        },
        
        generateGuid: function() {
            currentGuid += 1;
            
            return "__shelby__" + currentGuid;
        }
    };
})(Shelby.namespace);

// Shelby.extend
// ---------------------------------

(function(utils) {
    // Function use by some of the Shelby object to let you extend them with
    // additional instance properties.
    Shelby.extend = function(/* objects */) {
        if (arguments.length === 0) {
            throw new Error("At least 1 non-null plain object is required to extend a Shelby object.");
        }
        
        var objects = [];
        
        // Find all the objects that will extend the parent object.
        $.each(arguments, function(index, obj) {
            if (!utils.isObject(obj)) {
                throw new Error("Only non-null literal or prototyped object can extend a Shelby object.");
            }
            
            objects.push(utils.isNull(obj.prototype) ? obj : obj.prototype);
        });

        var parent = this;
        var child = null;

        // Mixin the parent prototype with the objects properties.
        var prototype = $.extend.apply($, [true, {}, parent.prototype].concat(objects));

        if ($.isFunction(prototype._initialize)) {
            child = function() {
                parent.apply(this, arguments);
                
                if ($.isFunction(prototype._initialize)) {
                    prototype._initialize.apply(this, arguments);
                }
            };
        }
        else {
            child = function() { 
                parent.apply(this, arguments);
            };
        }
        
        child.prototype = prototype;
        
        // Convenience property to access the parent prototype.
        child.prototype._super = parent.prototype;
        
        // Static function to allow multiple extends.
        child.extend = Shelby.extend;
        
        return child;
    };
})(Shelby.utils);

// Shelby.Factory
//
// Factory creating lazy singleton for Shelby dependency objects. This allow you to easily
// modify the dependency objects prototype before Shelby instantiate and use them.
// ---------------------------------

(function(extend, utils) {
    Shelby.Factory = function() {
        this._filters = null;
        this._propertyExtender = null;
        this._parser = null;
        this._ajax = null;
        this._mapper = null;
        this._mediator = null;
    };
    
    Shelby.Factory.prototype = {
        filters: function() {
            if (utils.isNull(this._filters)) {
                this._filters = new Shelby.Filters();
            }
            
            return this._filters;
        },

        propertyExtender: function() {
            if (utils.isNull(this._propertyExtender)) {
                this._propertyExtender = new Shelby.PropertyExtender();
            }
            
            return this._propertyExtender;
        },
        
        parser: function() {
            if (utils.isNull(this._parser)) {
                this._parser = new Shelby.Parser();
            }
            
            return this._parser;
        },
        
        ajax: function() {
            if (utils.isNull(this._ajax)) {
                this._ajax = new Shelby.Ajax();
            }
            
            return this._ajax;
        },
        
        mapper: function() {
            if (utils.isNull(this._mapper)) {
                this._mapper = new Shelby.Mapper();
            }
            
            return this._mapper;
        },

        mediator: function() {
            if (utils.isNull(this._mediator)) {
                this._mediator = new Shelby.Mediator();
            }
            
            return this._mediator;
        }
    };
    
    Shelby.Factory.extend = extend;
    Shelby.Factory.instance = new Shelby.Factory();
})(Shelby.extend, 
   Shelby.utils);

// Shelby.Parser
// ---------------------------------

(function(extend, utils) {
    Shelby.Parser = function() {
        this._current = null;
        this._options = null;
        this._context = null;
    };
    
    Shelby.Parser.prototype = {
        parse: function(obj, options, context) {
            if (utils.isNull(obj)) {
                throw new Error("\"obj\" must be a non-null object.");
            }

            this._reset(obj, options, context);
            this._next("", obj, "", null);
        },
        
        _reset: function(obj, options, context) {
            this._current = obj;
            this._options = this._computeOptions(options);
            this._context = context;
        },
        
        _computeOptions: function(options) {
            options = utils.isNull(options) ? {} : utils.clonePlainObject(options);
            
            // To speed up things, if no filter are specified use a dummy function that always return true.
            if (!$.isFunction(options.filter)) {
                options.filter = function() {
                    return true;
                };
            }
            
            return options;
        },
        
        _next: function(key, value, path, parent) {
            var augmentedPath = this._augmentPath(path, key);
            
            if (this._options.filter.apply(this, [key, value, path])) {
                if (this._isArray(value)) {
                    return this._array(key, value, augmentedPath, parent);
                }
                else if (utils.isObject(value)) {
                    return this._object(key, value, augmentedPath, parent);
                }
                else if ($.isFunction(value)) {
                    return this._scalar(key, value, augmentedPath, parent, this._options.onFunction);
                }
                else {
                    return this._scalar(key, value, augmentedPath, parent, this._options.onPrimitive);
                }
            }
            
            return true;
        },
        
        _object: function(key, obj, path, parent) {
            var proceed = this._scalar(key, obj, path, parent, this._options.onObject);
        
            if (proceed !== false) {
                for (var childKey in obj) {
                    if (utils.hasOwnProperty(obj, childKey)) {
                        proceed = this._next(childKey, obj[childKey], path, obj);
                        
                        if (proceed === false) {
                            break;
                        }
                    }
                }
            }
            
            return proceed;
        },
        
        _array: function(key, array, path, parent) {
            var proceed = this._scalar(key, array, path, parent, this._options.onArray);
        
            if (proceed !== false) {
                var unwrappedArray = ko.utils.peekObservable(array);
            
                for (var i = 0, max = unwrappedArray.length; i < max; i += 1) {
                    proceed = this._next("i", unwrappedArray[i], path, array);
                    
                    if (proceed === false) {
                        break;
                    }
                }
            }
            
            return proceed;
        },
        
        _scalar: function(key, value, path, parent, handler) {
            if ($.isFunction(handler)) {
                var args = {
                    key: key,
                    value: value,
                    path: path,
                    parent: parent,
                    obj: this._current
                };
                
                return handler.call(this._context, args);
            }
        },
        
        _isArray: function(value) {
            value = ko.utils.peekObservable(value);
        
            return $.isArray(value);
        },
        
        _augmentPath: function(actualPath, newPart) {
            if (actualPath === "/") {
                return actualPath + newPart;
            }
            
            return actualPath + "/" + newPart;
        }
    };
    
    Shelby.Parser.extend = extend;
})(Shelby.extend,
   Shelby.utils);

// Shelby.Filters
// ---------------------------------

(function(namespace, extend, utils) {
    Shelby.Filters = function() {
    };

    Shelby.Filters.prototype = {
        getExtendablePropertyFilter: function() {
            return function(key, value) {
                // Object must be added to the filter, otherwise if they are rejected, their child properties would be ignored.
                return key !== namespace && (ko.isObservable(value) || utils.isObject(value));
            };
        },

        getExtendedPropertyFilter: function() {
            return function(key, value) {
                // Object must be added to the filter, otherwise if they are rejected, their child properties would be ignored.
                return key !== namespace && ((ko.isObservable(value) || utils.isObject(value)) && utils.isImplementingShelby(value));
            };
        },

        getPathFilter: function(includePaths, excludePaths) {
            if ($.isArray(includePaths)) {
                return this._getIncludePathFilter(includePaths);
            }
            else if ($.isArray(excludePaths)) {
                return this._getExcludePathFilter(excludePaths);
            }
            else {
                return this._getDefaultPathFilter();
            }
        },

        _getIncludePathFilter: function(paths) {
            var that = this;
            var evaluators = this._computeEvaluators(paths);

            return function(path) {
                var result = null;
                var hasImperfectMatch = false;

                var comparer = function(evaluator) {
                    result = evaluator(path);

                    // To support any order for the inclusion filters, we loop until we find a perfect 
                    // match. This will support a case where an array item filter is specified before 
                    // an inclusion filter on the array itself.
                    if (result.isValid && !result.isPerfectMatch) {
                        hasImperfectMatch = true;

                        return false;
                    }

                    return result.isValid;
                };

                if (utils.arrayIndexOf(evaluators, path, comparer) === -1) {
                    if (hasImperfectMatch) {
                        return that._createImperfectMatchEvaluationResult();
                    }

                    return that._createInvalidEvaluationResult();
                }

                return result;
            };
        },

        _getExcludePathFilter: function(paths) {
            var that = this;
            var evaluators = this._computeEvaluators(paths);

            return function(path) {
                var comparer = function(evaluator) {
                    var result = evaluator(path);

                    return result.isValid && result.isPerfectMatch;
                };

                if (utils.arrayIndexOf(evaluators, path, comparer) === -1) {
                    return that._createPerfectMatchEvaluationResult();
                }

                return that._createInvalidEvaluationResult();
            };
        },

        _getDefaultPathFilter: function() {
            var that = this;

            return function() {
                return that._createPerfectMatchEvaluationResult();
            };
        },

        _computeEvaluators: function(paths) {
            var that = this;

            return utils.arrayMap(paths, function(path) {
                // If this is a path matching array items, create a function that use a regular expression to match the current paths representing array items properties,
                // otherwise create a function that use the equality operator to match the current paths against the path.
                if (utils.stringEndsWith(path, "/i")) {
                    // Transform "/i" into regex expression [^]+ (means that everything is accepted).
                    var pattern = null;

                    try {
                        pattern = new RegExp(path.replace(/\/i/g, "[^]+"));
                    }
                    catch (e) {
                        // IE8 cause a RegExpError exception when the ']' character is not escaped.
                        pattern = new RegExp(path.replace(/\/i/g, "[^]]+"));
                    }

                    return function(current) {
                        if (pattern.test(current)) {
                            return that._createPerfectMatchEvaluationResult();
                        }
                        else if (that._isArrayPath(path, current)) {
                            return that._createImperfectMatchEvaluationResult();
                        }

                        return that._createInvalidEvaluationResult();
                    };
                }
                else {
                    return function(current) {
                        if (path === current) {
                            return that._createPerfectMatchEvaluationResult();
                        }
                        else if (that._isArrayPath(path, current)) {
                            return that._createImperfectMatchEvaluationResult();
                        }

                        return that._createInvalidEvaluationResult();
                    };
                }
            });
        },

        _createInvalidEvaluationResult: function() {
            return this._createEvaluationResult(false, false);
        },

        _createImperfectMatchEvaluationResult: function() {
            return this._createEvaluationResult(true, false);
        },

        _createPerfectMatchEvaluationResult: function() {
            return this._createEvaluationResult(true, true);
        },

        _createEvaluationResult: function(isValid, isPerfectMatch) {
            return {
                isValid: isValid,
                isPerfectMatch: isPerfectMatch
            };
        },

        _isArrayPath: function(path, current) {
            return path.indexOf(current + "/i") !== -1;
        }
    };

    Shelby.Filters.extend = extend;
})(Shelby.namespace,
   Shelby.extend,
   Shelby.utils);

// Shelby.Extenders - Core
// ---------------------------------

(function(namespace, extend, utils, factory) {
    var PropertyType = Shelby.PropertyType = {
        Object: 0,
        Array: 1,
        Scalar: 2
    };

    Shelby.Extenders = {
    };

    // ---------------------------------
    
    Shelby.Extenders.base = function(target) {
        if (utils.isNull(this._target)) {
            this._target = function() {
                return target;
            };
        }
    };
    
    Shelby.Extenders.base.extend = extend;

    // ---------------------------------

    Shelby.PropertyExtender = function() {
    };
    
    Shelby.PropertyExtender.prototype = {
        add: function(target, extenders) {
            if (utils.isNull(target)) {
                throw new Error("\"target\" must be an object.");
            }

            if (utils.isNull(extenders)) {
                throw new Error("\"extenders\" must be an object literal.");
            }
        
            // Prevent multiple extends.
            if (!utils.hasProperty(target, namespace)) {
                var that = this;
            
                var action = function(type) {
                    return function(property) {
                        that._extendProperty(property, type, extenders);
                    };
                };
                
                // Iterate on the target properties to extend all the objects and observables matching criterias.
                factory.parser().parse(target, {
                    filter: factory.filters().getExtendablePropertyFilter(),
                    onObject: action(PropertyType.Object),
                    onArray: action(PropertyType.Array),
                    onFunction: action(PropertyType.Scalar)
                });
            }
        },
        
        remove: function(target) {
            if (utils.isNull(target)) {
                throw new Error("\"target\" must be an object.");
            }
        
            var action = function(property) {
                delete property.value[namespace];
            };
        
            // Iterate on the target properties to remove shelby extenders.
            factory.parser().parse(target, {
                filter: factory.filters().getExtendedPropertyFilter(),
                onObject: action,
                onArray: action,
                onFunction: action
            });
        },
        
        _extendProperty: function(property, type, extenders) {
            property.value[namespace] = {};
        
            // Retrieve all the extenders to apply. This is done by doing a concatenation
            // of the "common" extenders which are defined in the "*" property and specifics
            // extenders which are defined in a property matching the current property path.
            var propertyExtenders = extenders["*"] || {};
            
            if (utils.isObject(extenders[property.path])) {
                $.extend(propertyExtenders, extenders[property.path]);
            }
            
            // Apply the retrieved extenders.
            $.each(propertyExtenders, function() {
                this.apply(this, [property.value, type]);
            });
        }
    };
    
    Shelby.PropertyExtender.extend = extend;
})(Shelby.namespace,
   Shelby.extend,
   Shelby.utils,
   Shelby.Factory.instance);

// Shelby.Extenders - Subscribe
// ---------------------------------

(function(namespace, extend, utils, factory, PropertyType) {
    ko.extenders.shelbySubscribe = function(target) {
        // When true, all the subscriptions are pause.
        var pauseAllSubscriptions = false;
        
        $.extend(target[namespace], {
            subscribe: function(callback /*, [callbackTarget], [event] */) {
                if (!$.isFunction(callback)) {
                    throw new Error("First argument must be a callback function.");
                }
            
                /* jshint ignore:start */
                // Must keep a locally scoped variable of the callback otherwise IE 8 and 9 cause stack
                // overflow error.
                var originalCallback = callback;

                arguments[0] = function(value) {
                    if (!pauseAllSubscriptions && !pausableSubscription.isPause) {
                        // If this observable is not paused globally or this subscription is not paused,
                        // call the original callback with the original arguments.
                        originalCallback.apply(this, [value]);
                    }
                };
                /* jshint ignore:end */

                // Call the original knockout subscription function.
                var subscription = target.subscribe.apply(target, arguments);
                
                var pausableSubscription = {
                    isPause: false,
                
                    pause: function() {
                        this.isPause = true;
                    },
                    resume: function() {
                        this.isPause = false;
                    },
                    dispose: function() {
                        subscription.dispose();
                    }
                };
                
                return pausableSubscription;
            },
            
            pause: function() {
                pauseAllSubscriptions = true;
            },
            
            resume: function() {
                pauseAllSubscriptions = false;
            },
            
            isPause: function() {
                return pauseAllSubscriptions;
            }
        });
        
        return target;
    };

    // ---------------------------------

    ko.extenders.shelbyArraySubscribe = function(target) {
        var originalSubscribe = target[namespace].subscribe;

        if (!$.isFunction(originalSubscribe)) {
            throw new Error("The observable must be extended with \"ko.extenders.shelbySubscribe\".");
        }

        $.extend(target[namespace], {
            subscribe: function(callback /*, [callbackTarget], [event], [options] */) {
                var evaluateChanges = !utils.isObject(arguments[3]) || arguments[3].evaluateChanges !== false;

                if (evaluateChanges) {
                    if (!$.isFunction(callback)) {
                        throw new Error("First argument must be a callback function.");
                    }

                    /* jshint ignore:start */
                    // Must keep a locally scoped variable of the callback otherwise IE 8 and 9 cause stack
                    // overflow error.
                    var originalCallback = callback;

                    // Proxy callback function adding the array changes behavior.
                    arguments[0] = function(value) {
                        originalCallback.apply(this, [{ value: value }, true, "shelbyArraySubscribe"]);
                    };

                    // To activate the native array changes evaluation, the event must be "arrayChange",
                    // otherwise the standard observable subscription behaviour is applied.
                    arguments[2] = "arrayChange";
                    /* jshint ignore:end */
                }

                // Add the subscription.
                return originalSubscribe.apply(this, arguments);
            }
        });
    };

    // ---------------------------------

    Shelby.Extenders.subscribe = function(target, type) {
        // Apply the observable extenders to everything that is an observable.
        if (type !== PropertyType.Object) {
            target.extend(this._observableExtenders["*"]);
            
            if (type === PropertyType.Array) {
                var arrayExtenders = this._observableExtenders["array"];

                if (!utils.isNull(arrayExtenders)) {
                    target.extend(arrayExtenders);
                }
            }
            
            target[namespace]._subscriptions = {};
        }
        
        if (type === PropertyType.Object) {
            // Copy all the functions to the target.
            $.extend(target[namespace], new Shelby.Extenders.subscribe._ctor(target));
        }
    };
    
    Shelby.Extenders.subscribe._ctor = Shelby.Extenders.base.extend({
        _initialize: function() {
            this._delegatedSubscriptions = {};
        },
    
        subscribe: function(callback, options) {
            if (utils.isNull(callback)) {
                throw new Error("\"callback\" must be a function.");
            }
            
            var that = this;
            
            options = options || {};
            options.array = options.array || {};

            var propertyFilter = factory.filters().getPathFilter(options.include, options.exclude);
            
            var subscription = {
                // Unique identifier of the subscription.
                id: utils.generateGuid(),
                
                // Array having all the members of the subscriptions.
                members: [],
                
                // True if the subscription is paused, false otherwise.
                isPause: false,
                
                // The original subscription callback provided by the caller.
                callback: callback,
                
                pause: function() {
                    that._pauseSubscription(this);
                },
                resume: function() {
                    that._resumeSubscription(this);
                },
                dispose: function() {
                    that._disposeSubscription(this);
                }
            };
            
            // Add the current object properties to the subscriptions.
            this._addToSubscription(this._target(), subscription, propertyFilter, options, { path: "" });
            
            // If at least a property has been subscribed to, save the subscription data for further operations that handles
            // multiple subscriptions like "unsucribeAll", "mute" and "resume".
            if (subscription.members.length > 0) {
                this._delegatedSubscriptions[subscription.id] = subscription;
            }
            
            return subscription;
        },

        _addToSubscription: function(target, subscription, propertyEvaluator, options, context) {
            var that = this;
        
            // Handler called to subscribe to a property.
            var subscriber = $.isFunction(options.subscriber) ? options.subscriber : this._propertySubscriber;
        
            var action = function(property) {
                // Must do this check because of the automatic subscription of array's new items.
                if (utils.isImplementingShelby(property.value)) {
                    // Must consider a contextual path and parent to fully support the automatic subscription of array's new items.
                    var path = property.path === "/" && !utils.isNullOrEmpty(context.path) ? context.path : context.path + property.path;
                    var parent = property.path === "/" && !utils.isNull(context.parent) ? context.parent : property.parent;
                    var evaluationResult = propertyEvaluator(path);

                    // Even if this is not a perfect match, there is cases (like arrays) when we want to add a subscription
                    // to the property to handle special behaviours (like item's automatic subscriptions for arrays).
                    if (evaluationResult.isValid) {
                        // Abstraction to add additional informations when a subscription is triggered.
                        var proxyCallback = function(value, extendArguments, extender) {
                            var args = {
                                path: path,
                                parent: parent,
                                subscription: subscription
                            };
                            
                            // Give you more flexibility for the subscription arguments if you decide to write
                            // a custom extender and use it through the "subscriber" option by letting you extend
                            // the arguments that are passed to the subscriber.
                            $.extend(args, extendArguments === true ? value : { value: value });

                            if (extender === "shelbyArraySubscribe" && options.array.trackChildren !== false) {
                                $.each(value.value, function() {
                                    if (this.status === "added") {
                                        // If a custom extender indicate that an item is added to an array, automatically 
                                        // subscribe to that new item.
                                        that._addToSubscription(this.value, subscription, propertyEvaluator, options, {
                                            path: utils.stringEnsureEndsWith(path, "/") + "i",
                                            parent: property.value
                                        });
                                    }
                                    else if (this.status === "deleted") {
                                        // If a custom extender indicate that an item is removed from an array, automatically 
                                        // dispose all the subscriptions owned by that item.
                                        that._removeFromSubscription(this.value, subscription);
                                    }
                                });
                            }

                            if (evaluationResult.isPerfectMatch) {
                                // Notify subscribers.
                                subscription.callback.call(this, args);
                            }
                        };
                        
                        // Subscribe to the property.
                        var propertySubscription = subscriber(property, proxyCallback, options);
                        
                        // Save the property subscription on the property itself.
                        property.value[namespace]._subscriptions[subscription.id] = propertySubscription;
                        
                        // Add the property to the group.
                        subscription.members.push(property.value);
                    }
                }
            };
            
            // Iterate on the target properties to subscribe on all the observables matching criterias.
            factory.parser().parse(target, {
                filter: factory.filters().getExtendedPropertyFilter(),
                onArray: action,
                onFunction: action
            });
        },
        
        _removeFromSubscription: function(target, subscription) {
            var action = function(property) {
                var propertySubscription = property.value[namespace]._subscriptions[subscription.id];
                
                if (!utils.isNull(propertySubscription)) {
                    // Dispose KO subscription.
                    propertySubscription.dispose();
                    
                    // Remove the subscriptions from the repository.
                    delete property.value[namespace]._subscriptions[subscription.id];
                    
                    // Remove the property from the group.
                    utils.arrayRemoveValue(subscription.members, property.value);
                }
            };
        
            // Iterate on the target properties to dispose the subscriptions from all the observables matching criterias.
            factory.parser().parse(target, {
                filter: factory.filters().getExtendedPropertyFilter(),
                onArray: action,
                onFunction: action
            });
        },
        
        _propertySubscriber: function(property, callback, options) {
            var subscriptionOptions = null;

            // In case of an array, if a specific event has been specified, the array changes evaluation
            // will not be applied.
            if ($.isArray(property.value.peek()) && (options.array.evaluateChanges === false || !utils.isNullOrEmpty(options.event))) { 
                subscriptionOptions = { evaluateChanges: false };
            }

            return property.value[namespace].subscribe(callback, options.callbackTarget, options.event, subscriptionOptions);
        },
        
        _pauseSubscription: function(subscription) {
            this._executeSubscriptionOperation(subscription, function(propertySubscription) {
                propertySubscription.pause();
            });
            
            subscription.isPause = true;
        },
        
        _resumeSubscription: function(subscription) {
            this._executeSubscriptionOperation(subscription, function(propertySubscription) {
                propertySubscription.resume();
            });
            
            subscription.isPause = false;
        },
        
        _disposeSubscription: function(subscription) {
            this._executeSubscriptionOperation(subscription, function(propertySubscription) {
                propertySubscription.dispose();
            });

            utils.arrayClear(subscription.members);
            
            delete this._delegatedSubscriptions[subscription.id];
        },
        
        _executeSubscriptionOperation: function(subscription, action) {
            $.each(subscription.members, function() {
                var propertySubscription = this[namespace]._subscriptions[subscription.id];
                
                if (!utils.isNull(propertySubscription)) {
                    action(propertySubscription);
                }
            });
        },
        
        // Dispose of all the subscriptions.
        unsuscribeAll: function() {
            var that = this;
        
            $.each(this._delegatedSubscriptions, function() {
                that._disposeSubscription(this);
            });
        },
        
        // Pause all the subscriptions.
        mute: function() {
            var that = this;
        
            $.each(this._delegatedSubscriptions, function() {
                that._pauseSubscription(this);
            });
        },
        
        // Resume all the subscriptions.
        unmute: function() {
            var that = this;
        
            $.each(this._delegatedSubscriptions, function() {
                that._resumeSubscription(this);
            });
        }
    });
    
    Shelby.Extenders.subscribe._ctor.extend = extend;
    
    Shelby.Extenders.subscribe._observableExtenders = { 
        "*": {
            shelbySubscribe: true
        },
        "array": {
            shelbyArraySubscribe: true
        }
    };
})(Shelby.namespace, 
   Shelby.extend,
   Shelby.utils,
   Shelby.Factory.instance,
   Shelby.PropertyType);

// Shelby.Extenders - Edit
// ---------------------------------

(function(namespace, extend, utils, factory, PropertyType) {
    ko.extenders.shelbyEdit = function(target) {
        if (!$.isFunction(target[namespace].pause) || !$.isFunction(target[namespace].resume)) {
            throw new Error(utils.stringFormat("\"shelbyEditable\" can only extends an observable having \"{1}.pause\" and \"{1}.resume\" functions.", namespace));
        }

        var wasPause = false;
    
        $.extend(target[namespace], {
            current: target.peek(),
            
            hasMutated: false,
            isEditing: false,
            deferNotifications: false,
            
            beginEdit: function(deferNotifications) {
                if (!this.isEditing) {
                    this.current = target.peek();
                    this.deferNotifications = deferNotifications !== false ? true : false;

                    if (this.deferNotifications) {
                        // Must keep track of the subscription "pause" status at the beginning of the edition
                        // to prevent resuming the subscription at the end of the edition if it was originally pause.
                        wasPause = target[namespace].isPause();

                        if (!wasPause) {
                            // Prevent the propagation of the notifications to subscribers before an
                            // explicit call to "endEdit" function has been made.
                            target[namespace].pause();
                        }
                    }

                    // Start edition.
                    this.isEditing = true;
                }
            },
            
            endEdit: function(canNotify) {
                var that = this;

                if (this.isEditing && this.hasMutated) {
                    this.current = target.peek();
                }
                
                if (this.isEditing) {
                    if (!wasPause && this.deferNotifications !== false) {
                        var hasMutated = that.hasMutated;

                        // Defer the "resume" to prevent synchronization problem with the UI.
                        setTimeout(function() {
                            target[namespace].resume();

                            // When the notifications are resumed, if the observable has been edited and the mute options
                            // is not specified, force a notification since the previous notifications has been "eat" because
                            // the notifications were paused.
                            if (hasMutated && canNotify !== false) {
                                target.valueWillMutate();
                                target.valueHasMutated();
                            }

                            
                        }, 10);
                    }
                }
                           
                this.hasMutated = false;     
                this.isEditing = false;
            },

            resetEdit: function() {
                if (this.isEditing && this.hasMutated) {
                    target(this.current);
                }
            },
            
            cancelEdit: function() {
                target[namespace].resetEdit();

                if (this.isEditing) {
                    if (!wasPause && this.deferNotifications !== false) {
                        // Defer the "resume" to prevent synchronization problem with the UI.
                        setTimeout(function() {
                            target[namespace].resume();
                        }, 10);
                    }
                }
                
                this.isEditing = false;
                this.hasMutated = false;
            }
        });
        
        target.subscribe(function(value) {
            if (!utils.isNull(target[namespace]) && target[namespace].isEditing && !target[namespace].hasMutated) {
                if ($.isArray(value)) {
                    target[namespace].hasMutated = ko.utils.compareArrays(target[namespace].current, value).length === 0;
                }
                else {
                    target[namespace].hasMutated = value !== target[namespace].current;
                }
            }
        });
        
        return target;
    };

    // ---------------------------------

    Shelby.Extenders.edit = function(target, type) {
        if (type !== PropertyType.Object) {
            target.extend(this._observableExtenders);
        }
        
        if (type === PropertyType.Object) {
            // Copy all the functions to the target.
            $.extend(target[namespace], new Shelby.Extenders.edit._ctor(target));
        }
    };
    
    Shelby.Extenders.edit._ctor = Shelby.Extenders.base.extend({
        _initialize: function() {
            this.isEditing = false;
        
            // Options for the current edition. 
            // The object structure is:
            //  - include: An array of property paths that will compose the edition.
            //  - exclude: An array of property paths that will be exclude from the edition.
            this._editOptions = null;
        },
        
        beginEdit: function(options) {
            if (!this.isEditing) {
                this._editOptions = options || {};
            
                this._executeEditAction(function(property) {
                    property.value[namespace].beginEdit(this._editOptions.deferNotifications);
                });
                
                this.isEditing = true;
            }
        },

        endEdit: function(notifyOnce) {
            if (this.isEditing) {
                // Evaluator that handles the notifications count option.
                var canNotify = null;
                
                if (notifyOnce === true) {
                    if (this._editOptions.deferNotifications === true) {
                        throw new Error("The \"notify once\" options is not supported when the edition has been started with the \"defer notifications\" disabled.");
                    }

                    canNotify = function(context) {
                        return context.count === 1;
                    };
                }
                else {
                    canNotify = function() {
                        return true;
                    };
                }
                
                var action = function(property, context) {
                    if (property.value[namespace].isEditing === true) {
                        if (property.value[namespace].hasMutated) {
                            context.count += 1;
                        }

                        property.value[namespace].endEdit(canNotify(context));
                    }
                };
            
                this._executeEditAction(action, {
                    count: 0
                });
                
                this.isEditing = false;
            }
        },

        resetEdit: function() {
            if (this.isEditing) {
                this._executeEditAction(function(property) {
                    if (property.value[namespace].isEditing === true) {
                        property.value[namespace].resetEdit();
                    }
                });
            }
        },
        
        cancelEdit: function() {
            if (this.isEditing) {
                this._executeEditAction(function(property) {
                    if (property.value[namespace].isEditing === true) {
                        property.value[namespace].cancelEdit();
                    }
                });
                
                this.isEditing = false;
            }
        },
        
        hasMutated: function() {
            var ret = false;
        
            if (this.isEditing) {
                this._executeEditAction(function(property) {
                    if (property.value[namespace].hasMutated) {
                        ret = true;
                        
                        return false;
                    }
                });
            }
            
            return ret;
        },
        
        _executeEditAction: function(action, context) {
            var that = this;

            // Filter that handles the include / exclude options by evaluating the property
            // paths against the specified options and filter out the paths that doesn't match the 
            // options.
            var propertyEvaluator = factory.filters().getPathFilter(this._editOptions.include, this._editOptions.exclude);
        
            var execute = function(property) {
                if (propertyEvaluator(property.path).isPerfectMatch) {
                    return action.apply(that, [property, context]);
                }
            };
        
            // Iterate on the target properties to execute the action on all the observables matching criterias.
            factory.parser().parse(this._target(), {
                filter: factory.filters().getExtendedPropertyFilter(),
                onArray: execute,
                onFunction: execute
            });
        }
    });
    
    Shelby.Extenders.edit._ctor.extend = extend;
    
    Shelby.Extenders.edit._observableExtenders = {
        shelbyEdit: true
    };
})(Shelby.namespace,
   Shelby.extend,
   Shelby.utils,
   Shelby.Factory.instance,
   Shelby.PropertyType);

// Shelby.Extenders - Utility
// ---------------------------------

(function(namespace, extend, utils, factory, PropertyType) {
    Shelby.Extenders.utility = function(target, type) {
        if (type !== PropertyType.Scalar) {
            // Copy all the functions to the target.
            $.extend(target[namespace], new Shelby.Extenders.utility._ctor(target));
        }
    };
    
    Shelby.Extenders.utility._ctor = Shelby.Extenders.base.extend({
        reset: function() {
            var value = null;
            var options = {};
            
            if (utils.isObject(arguments[1])) {
                value = arguments[0];
                options = arguments[1];
            }
            else if (utils.isObject(arguments[0])) {
                options = arguments[0];
            }
            else if (arguments.length > 0) {
                value = arguments[0];
            }

            var action = function(property) {
                if (utils.hasProperty(options, property.path)) {
                    property.value(options[property.path]);
                }
                else {
                    property.value(value);
                }
            };
        
            // Iterate on the target properties to reset all the observables matching criterias.
            factory.parser().parse(this._target(), {
                filter: factory.filters().getExtendedPropertyFilter(),
                onFunction: action
            });
        },
        
        updateFrom: function(obj) {
            if (!utils.isObject(obj)) {
                throw new Error("\"obj\" must be an object.");
            }

            try {
                factory.mapper().update(this._target(), obj);
            }
            catch (e) {
                throw new Error("An error occurred while updating the target object. Make sure that all the observables properties of the target object has been created by the Shelby mapper.");
            }
        }
    });
    
    Shelby.Extenders.utility._ctor.extend = extend;
})(Shelby.namespace, 
   Shelby.extend,
   Shelby.utils,
   Shelby.Factory.instance,
   Shelby.PropertyType);

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
})(Shelby.debug,
   Shelby.extend, 
   Shelby.utils);

// Shelby.Mapper
// ---------------------------------

(function(extend) {
    Shelby.Mapper = function() {
    };

    Shelby.Mapper.prototype = {
        fromJS: function() {
            return ko.viewmodel.fromModel.apply(ko.viewmodel, arguments);
        },
        
        toJS: function() {
            return ko.viewmodel.toModel.apply(ko.viewmodel, arguments);
        },
        
        update: function() {
            return ko.viewmodel.updateFromModel.apply(ko.viewmodel, arguments);
        }
    };
    
    Shelby.Mapper.extend = extend;
})(Shelby.extend);

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



return Shelby;

});
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"jquery":1,"knockout":2}],4:[function(require,module,exports){
(function() {
    // var test = require("knockout");

    // test();

    var knockout = require("knockout");
    var shelby = require("../../build/shelby.js");

    var ViewModel = shelby.ViewModel.extend({
        message: knockout.observable("Bootstrapping Shelby with browserify works!")
    });

    new ViewModel().bind();
})();
},{"../../build/shelby.js":3,"knockout":5}],5:[function(require,module,exports){
module.exports=require(2)
},{}]},{},[4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcZGV2XFxzaGVsYnlcXG5vZGVfbW9kdWxlc1xcZ3VscC1icm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6L2Rldi9zaGVsYnkvYnVpbGQvbm9kZV9tb2R1bGVzL2pxdWVyeS9pbmRleC5qcyIsIkM6L2Rldi9zaGVsYnkvYnVpbGQvbm9kZV9tb2R1bGVzL2tub2Nrb3V0L2luZGV4LmpzIiwiQzovZGV2L3NoZWxieS9idWlsZC9zaGVsYnkuanMiLCJDOi9kZXYvc2hlbGJ5L3Rlc3QvZXhwb3J0cy9mYWtlXzc3YTM3NTZmLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0galF1ZXJ5OyIsIm1vZHVsZS5leHBvcnRzID0ga287IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuKGZ1bmN0aW9uKGZhY3RvcnkpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG4gICAgXHJcbiAgICBpZiAodHlwZW9mIHJlcXVpcmUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgIHZhciBpbnN0YW5jZSA9IGZhY3RvcnkocmVxdWlyZShcImpxdWVyeVwiKSwgcmVxdWlyZShcImtub2Nrb3V0XCIpKTtcclxuXHJcbiAgICAgICAgLy8gQ29tbW9uSlNcclxuICAgICAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgZXhwb3J0cyA9IGluc3RhbmNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTm9kZS5qcyBhbmQgQnJvd3NlcmlmeVxyXG4gICAgICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gaW5zdGFuY2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICAvLyBSZWdpc3RlciBhcyBhIG5hbWVkIEFNRCBtb2R1bGUuXHJcbiAgICAgICAgZGVmaW5lKFwic2hlbGJ5XCIsIFtcclxuICAgICAgICAgICAgXCJqcXVlcnlcIixcclxuICAgICAgICAgICAgXCJrbm9ja291dFwiXHJcbiAgICAgICAgXSwgZmFjdG9yeSk7XHJcbiAgICB9IFxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHdpbmRvdyB8fCBnbG9iYWw7XHJcblxyXG4gICAgICAgIC8vIEV4cG9zZSBhcyBhIGdsb2JhbCBvYmplY3QuXHJcbiAgICAgICAgd2luZG93LlNoZWxieSA9IGZhY3Rvcnkod2luZG93LmpRdWVyeSwgd2luZG93LmtvKTtcclxuICAgIH1cclxufSkoZnVuY3Rpb24oJCwga28pIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuLyoganNoaW50IC1XMDc5ICovXHJcbnZhciBTaGVsYnkgPSB7fTtcclxuLyoganNoaW50ICtXMDc5ICovXHJcblxyXG4vLyBDdXJyZW50IHZlcnNpb24uXHJcblNoZWxieS52ZXJzaW9uID0gXCIwLjIuMFwiO1xyXG5cclxuLy8gQWxsIGV4dGVuc2lvbnMgYXJlIGFkZGVkIGludG8gYSBjdXN0b20gXCJzaGVsYnlcIiBuYW1lc3BhY2UgdG8gYXZvaWQgcG9sdWF0aW5nIHRoZSBcclxuLy8gcm9vdCBvZiBvYmplY3RzIG9yIG9ic2VydmFibGVzLlxyXG5TaGVsYnkubmFtZXNwYWNlID0gXCJzaGVsYnlcIjtcclxuXHJcbi8vIFdoZW4gdHJ1ZSwgYWRkaXRpb25hbCBpbmZvcm1hdGlvbnMgd2lsbCBiZSBvdXRwdXQgdG8gdGhlIGNvbnNvbGUuXHJcblNoZWxieS5kZWJ1ZyA9IGZhbHNlO1xyXG5cclxuLy8gVXRpbHNcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24obmFtZXNwYWNlLCB1bmRlZmluZWQpIHtcclxuICAgIHZhciBvYmplY3RIYXNPd25Qcm9wZXJ0eVN1cHBvcnRlZCA9ICQuaXNGdW5jdGlvbihPYmplY3QuaGFzT3duUHJvcGVydHkpO1xyXG4gICAgdmFyIG9iamVjdEtleXNTdXBwb3J0ZWQgPSAkLmlzRnVuY3Rpb24oT2JqZWN0LmtleXMpO1xyXG4gICAgdmFyIGFycmF5SW5kZXhPZlN1cHBvcnRlZCA9ICQuaXNGdW5jdGlvbihBcnJheS5wcm90b3R5cGUuaW5kZXhPZik7XHJcbiAgICB2YXIgYXJyYXlNYXBTdXBwb3J0ZWQgPSAkLmlzRnVuY3Rpb24oQXJyYXkucHJvdG90eXBlLm1hcCk7XHJcbiAgICAgICAgXHJcbiAgICB2YXIgY3VycmVudEd1aWQgPSAwO1xyXG4gICAgXHJcbiAgICBTaGVsYnkudXRpbHMgPSB7XHJcbiAgICAgICAgaXNVbmRlZmluZWQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSA9PT0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgaXNOdWxsOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc1VuZGVmaW5lZCh2YWx1ZSkgfHwgdmFsdWUgPT09IG51bGw7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBpc051bGxPckVtcHR5OiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc051bGwodmFsdWUpIHx8IHZhbHVlID09PSBcIlwiO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgaXNTdHJpbmc6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpID09PSBcIltvYmplY3QgU3RyaW5nXVwiO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgaXNPYmplY3Q6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24odmFsdWUpIHx8ICQuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgPT09IE9iamVjdCh2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBpc2pRdWVyeUVsZW1lbnQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIGpRdWVyeTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc0RvbUVsZW1lbnQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUub3duZXJEb2N1bWVudC5kb2N1bWVudEVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImh0bWxcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEN1c3RvbSBoYXNPd25Qcm9wZXJ0eSBmdW5jdGlvbiBwcm92aWRpbmcgYSBmYWxsYmFjayBpZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb25cclxuICAgICAgICAvLyBpcyBub3QgYXZhaWxhYmxlIGZvciB0aGUgY3VycmVudCBicm93c2VyLlxyXG4gICAgICAgIC8qIGpzaGludCAtVzAwMSAqL1xyXG4gICAgICAgIGhhc093blByb3BlcnR5OiBmdW5jdGlvbihvYmosIGtleSkge1xyXG4gICAgICAgICAgICBpZiAoIW9iamVjdEhhc093blByb3BlcnR5U3VwcG9ydGVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5IGluIG9iajtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoganNoaW50ICtXMDAxICovXHJcbiAgICAgICAgXHJcbiAgICAgICAgaGFzUHJvcGVydHk6IGZ1bmN0aW9uKG9iaiwga2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXkgaW4gb2JqO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgY2xvbmVQbGFpbk9iamVjdDogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNsb25lQXJyYXk6IGZ1bmN0aW9uKGFycmF5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcnJheS5zbGljZSgwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEN1c3RvbSBhcnJheSBpbmRleE9mIGZ1bmN0aW9uIHByb3ZpZGluZyBhIGZhbGxiYWNrIGlmIHRoZSBvcmlnaW5hbCBmdW5jdGlvblxyXG4gICAgICAgIC8vIGlzIG5vdCBhdmFpbGFibGUgZm9yIHRoZSBjdXJyZW50IGJyb3dzZXIgYW5kIGFkZCBzdXBwb3J0IGZvciBhIGNvbXBhcmVyIHRvIGhhbmRsZSBcclxuICAgICAgICAvLyBjb21wbGV4IHR5cGUuXHJcbiAgICAgICAgYXJyYXlJbmRleE9mOiBmdW5jdGlvbihhcnJheSwgdmFsdWUsIGNvbXBhcmVyLCBjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIGlmICghYXJyYXlJbmRleE9mU3VwcG9ydGVkIHx8IGNvbXBhcmVyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc051bGwoY29tcGFyZXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyZXIgPSBmdW5jdGlvbihjdXJyZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50ID09PSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBtYXggPSBhcnJheS5sZW5ndGg7IGkgPCBtYXg7IGkgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wYXJlci5hcHBseShjb250ZXh0LCBbYXJyYXlbaV0sIHZhbHVlXSkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBhcnJheS5pbmRleE9mKHZhbHVlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIGFycmF5R2V0VmFsdWU6IGZ1bmN0aW9uKGFycmF5LCB2YWx1ZSwgY29tcGFyZXIpIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5hcnJheUluZGV4T2YoYXJyYXksIHZhbHVlLCBjb21wYXJlcik7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyYXlbaW5kZXhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIGFycmF5UmVtb3ZlSW5kZXg6IGZ1bmN0aW9uKGFycmF5LCBpbmRleCkge1xyXG4gICAgICAgICAgICBhcnJheS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgYXJyYXlSZW1vdmVWYWx1ZTogZnVuY3Rpb24oYXJyYXksIHZhbHVlLCBjb21wYXJlcikge1xyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmFycmF5SW5kZXhPZihhcnJheSwgdmFsdWUsIGNvbXBhcmVyKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXJyYXlSZW1vdmVJbmRleChhcnJheSwgaW5kZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYXJyYXlDbGVhcjogZnVuY3Rpb24oYXJyYXkpIHtcclxuICAgICAgICAgICAgd2hpbGUgKGFycmF5Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGFycmF5LnBvcCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBhcnJheU1hcDogZnVuY3Rpb24oYXJyYXksIG1hcHBlciwgY29udGV4dCkge1xyXG4gICAgICAgICAgICBpZiAoIWFycmF5TWFwU3VwcG9ydGVkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwcGVkID0gW107XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIG1heCA9IGFycmF5Lmxlbmd0aDsgaSA8IG1heDsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFwcGVkLnB1c2gobWFwcGVyLmFwcGx5KGNvbnRleHQsIFthcnJheVtpXSwgaSwgYXJyYXldKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXBwZWQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhcnJheS5tYXAobWFwcGVyLCBjb250ZXh0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIGFycmF5TWFwVG9PYmplY3Q6IGZ1bmN0aW9uKGFycmF5LCBrZXlQcm9wZXJ0eSwgdmFsdWVQcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0ge307XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBtYXggPSBhcnJheS5sZW5ndGg7IGkgPCBtYXg7IGkgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgb2JqW2FycmF5W2ldW2tleVByb3BlcnR5XV0gPSBhcnJheVtpXVt2YWx1ZVByb3BlcnR5XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIG9iajtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIG9iamVjdE1hcDogZnVuY3Rpb24ob2JqLCBtYXBwZXIsIGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdmFyIG1hcHBlZE9iamVjdCA9IHt9O1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkob2JqLCBrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFwcGVkT2JqZWN0W2tleV0gPSBtYXBwZXIuYXBwbHkoY29udGV4dCwgW29ialtrZXldLCBrZXksIG9ial0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gbWFwcGVkT2JqZWN0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgb2JqZWN0S2V5czogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgICAgIGlmICghb2JqZWN0S2V5c1N1cHBvcnRlZCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5S2V5cyA9IFtdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eShvYmosIGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlLZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eUtleXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgb2JqZWN0U2l6ZTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9iamVjdEtleXMob2JqKS5sZW5ndGg7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBpc0ltcGxlbWVudGluZzogZnVuY3Rpb24ob2JqLCBwcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBtYXggPSBwcm9wZXJ0aWVzLmxlbmd0aDsgaSA8IG1heDsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShwcm9wZXJ0aWVzW2ldIGluIG9iaikpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgaXNQYXJ0aWFsbHlJbXBsZW1lbnRpbmc6IGZ1bmN0aW9uKG9iaiwgcHJvcGVydGllcykge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbWF4ID0gcHJvcGVydGllcy5sZW5ndGg7IGkgPCBtYXg7IGkgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNbaV0gaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpc0ltcGxlbWVudGluZ1NoZWxieTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhhc1Byb3BlcnR5KG9iaiwgbmFtZXNwYWNlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFRva2VucyBzdGFydCBhdCBpbmRleCAxLiBFeC4gezF9LCB7Mn0uLi5cclxuICAgICAgICBzdHJpbmdGb3JtYXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuICAgICAgICAgICAgdmFyIHN0ciA9IGFyZ3NbMF07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xceyhcXGQrKVxcfS9nLCBmdW5jdGlvbihtLCBuKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJnc1tuXTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc3RyaW5nQ29udGFpbnM6IGZ1bmN0aW9uKHN0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0ci5pbmRleE9mKHZhbHVlKSAhPT0gLTE7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBzdHJpbmdFbmRzV2l0aDogZnVuY3Rpb24oc3RyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RyLmluZGV4T2YodmFsdWUsIHN0ci5sZW5ndGggLSB2YWx1ZS5sZW5ndGgpICE9PSAtMTsgICAgICAgXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBzdHJpbmdFbnN1cmVFbmRzV2l0aDogZnVuY3Rpb24oc3RyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJpbmdFbmRzV2l0aChzdHIsIHZhbHVlKSA/IHN0ciA6IChzdHIgKyB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBkZWJ1ZzogZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNOdWxsKGNvbnNvbGUubG9nKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIGdlbmVyYXRlR3VpZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRHdWlkICs9IDE7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gXCJfX3NoZWxieV9fXCIgKyBjdXJyZW50R3VpZDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59KShTaGVsYnkubmFtZXNwYWNlKTtcclxuXHJcbi8vIFNoZWxieS5leHRlbmRcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24odXRpbHMpIHtcclxuICAgIC8vIEZ1bmN0aW9uIHVzZSBieSBzb21lIG9mIHRoZSBTaGVsYnkgb2JqZWN0IHRvIGxldCB5b3UgZXh0ZW5kIHRoZW0gd2l0aFxyXG4gICAgLy8gYWRkaXRpb25hbCBpbnN0YW5jZSBwcm9wZXJ0aWVzLlxyXG4gICAgU2hlbGJ5LmV4dGVuZCA9IGZ1bmN0aW9uKC8qIG9iamVjdHMgKi8pIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdCBsZWFzdCAxIG5vbi1udWxsIHBsYWluIG9iamVjdCBpcyByZXF1aXJlZCB0byBleHRlbmQgYSBTaGVsYnkgb2JqZWN0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG9iamVjdHMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBGaW5kIGFsbCB0aGUgb2JqZWN0cyB0aGF0IHdpbGwgZXh0ZW5kIHRoZSBwYXJlbnQgb2JqZWN0LlxyXG4gICAgICAgICQuZWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uKGluZGV4LCBvYmopIHtcclxuICAgICAgICAgICAgaWYgKCF1dGlscy5pc09iamVjdChvYmopKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IG5vbi1udWxsIGxpdGVyYWwgb3IgcHJvdG90eXBlZCBvYmplY3QgY2FuIGV4dGVuZCBhIFNoZWxieSBvYmplY3QuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBvYmplY3RzLnB1c2godXRpbHMuaXNOdWxsKG9iai5wcm90b3R5cGUpID8gb2JqIDogb2JqLnByb3RvdHlwZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzO1xyXG4gICAgICAgIHZhciBjaGlsZCA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIE1peGluIHRoZSBwYXJlbnQgcHJvdG90eXBlIHdpdGggdGhlIG9iamVjdHMgcHJvcGVydGllcy5cclxuICAgICAgICB2YXIgcHJvdG90eXBlID0gJC5leHRlbmQuYXBwbHkoJCwgW3RydWUsIHt9LCBwYXJlbnQucHJvdG90eXBlXS5jb25jYXQob2JqZWN0cykpO1xyXG5cclxuICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKHByb3RvdHlwZS5faW5pdGlhbGl6ZSkpIHtcclxuICAgICAgICAgICAgY2hpbGQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKHByb3RvdHlwZS5faW5pdGlhbGl6ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBwcm90b3R5cGUuX2luaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGNoaWxkID0gZnVuY3Rpb24oKSB7IFxyXG4gICAgICAgICAgICAgICAgcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGNoaWxkLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDb252ZW5pZW5jZSBwcm9wZXJ0eSB0byBhY2Nlc3MgdGhlIHBhcmVudCBwcm90b3R5cGUuXHJcbiAgICAgICAgY2hpbGQucHJvdG90eXBlLl9zdXBlciA9IHBhcmVudC5wcm90b3R5cGU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gU3RhdGljIGZ1bmN0aW9uIHRvIGFsbG93IG11bHRpcGxlIGV4dGVuZHMuXHJcbiAgICAgICAgY2hpbGQuZXh0ZW5kID0gU2hlbGJ5LmV4dGVuZDtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gY2hpbGQ7XHJcbiAgICB9O1xyXG59KShTaGVsYnkudXRpbHMpO1xyXG5cclxuLy8gU2hlbGJ5LkZhY3RvcnlcclxuLy9cclxuLy8gRmFjdG9yeSBjcmVhdGluZyBsYXp5IHNpbmdsZXRvbiBmb3IgU2hlbGJ5IGRlcGVuZGVuY3kgb2JqZWN0cy4gVGhpcyBhbGxvdyB5b3UgdG8gZWFzaWx5XHJcbi8vIG1vZGlmeSB0aGUgZGVwZW5kZW5jeSBvYmplY3RzIHByb3RvdHlwZSBiZWZvcmUgU2hlbGJ5IGluc3RhbnRpYXRlIGFuZCB1c2UgdGhlbS5cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24oZXh0ZW5kLCB1dGlscykge1xyXG4gICAgU2hlbGJ5LkZhY3RvcnkgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLl9maWx0ZXJzID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9wcm9wZXJ0eUV4dGVuZGVyID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9wYXJzZXIgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2FqYXggPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX21hcHBlciA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fbWVkaWF0b3IgPSBudWxsO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgU2hlbGJ5LkZhY3RvcnkucHJvdG90eXBlID0ge1xyXG4gICAgICAgIGZpbHRlcnM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsKHRoaXMuX2ZpbHRlcnMpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9maWx0ZXJzID0gbmV3IFNoZWxieS5GaWx0ZXJzKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maWx0ZXJzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHByb3BlcnR5RXh0ZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsKHRoaXMuX3Byb3BlcnR5RXh0ZW5kZXIpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9wZXJ0eUV4dGVuZGVyID0gbmV3IFNoZWxieS5Qcm9wZXJ0eUV4dGVuZGVyKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wcm9wZXJ0eUV4dGVuZGVyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgcGFyc2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHV0aWxzLmlzTnVsbCh0aGlzLl9wYXJzZXIpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJzZXIgPSBuZXcgU2hlbGJ5LlBhcnNlcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyc2VyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgYWpheDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmICh1dGlscy5pc051bGwodGhpcy5fYWpheCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2FqYXggPSBuZXcgU2hlbGJ5LkFqYXgoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2FqYXg7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBtYXBwZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsKHRoaXMuX21hcHBlcikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX21hcHBlciA9IG5ldyBTaGVsYnkuTWFwcGVyKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYXBwZXI7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbWVkaWF0b3I6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsKHRoaXMuX21lZGlhdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbWVkaWF0b3IgPSBuZXcgU2hlbGJ5Lk1lZGlhdG9yKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tZWRpYXRvcjtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBTaGVsYnkuRmFjdG9yeS5leHRlbmQgPSBleHRlbmQ7XHJcbiAgICBTaGVsYnkuRmFjdG9yeS5pbnN0YW5jZSA9IG5ldyBTaGVsYnkuRmFjdG9yeSgpO1xyXG59KShTaGVsYnkuZXh0ZW5kLCBcclxuICAgU2hlbGJ5LnV0aWxzKTtcclxuXHJcbi8vIFNoZWxieS5QYXJzZXJcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4oZnVuY3Rpb24oZXh0ZW5kLCB1dGlscykge1xyXG4gICAgU2hlbGJ5LlBhcnNlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuX2N1cnJlbnQgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX29wdGlvbnMgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBudWxsO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgU2hlbGJ5LlBhcnNlci5wcm90b3R5cGUgPSB7XHJcbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKG9iaiwgb3B0aW9ucywgY29udGV4dCkge1xyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsKG9iaikpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlxcXCJvYmpcXFwiIG11c3QgYmUgYSBub24tbnVsbCBvYmplY3QuXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9yZXNldChvYmosIG9wdGlvbnMsIGNvbnRleHQpO1xyXG4gICAgICAgICAgICB0aGlzLl9uZXh0KFwiXCIsIG9iaiwgXCJcIiwgbnVsbCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBfcmVzZXQ6IGZ1bmN0aW9uKG9iaiwgb3B0aW9ucywgY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50ID0gb2JqO1xyXG4gICAgICAgICAgICB0aGlzLl9vcHRpb25zID0gdGhpcy5fY29tcHV0ZU9wdGlvbnMob3B0aW9ucyk7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgX2NvbXB1dGVPcHRpb25zOiBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB1dGlscy5pc051bGwob3B0aW9ucykgPyB7fSA6IHV0aWxzLmNsb25lUGxhaW5PYmplY3Qob3B0aW9ucyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBUbyBzcGVlZCB1cCB0aGluZ3MsIGlmIG5vIGZpbHRlciBhcmUgc3BlY2lmaWVkIHVzZSBhIGR1bW15IGZ1bmN0aW9uIHRoYXQgYWx3YXlzIHJldHVybiB0cnVlLlxyXG4gICAgICAgICAgICBpZiAoISQuaXNGdW5jdGlvbihvcHRpb25zLmZpbHRlcikpIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZmlsdGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucztcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIF9uZXh0OiBmdW5jdGlvbihrZXksIHZhbHVlLCBwYXRoLCBwYXJlbnQpIHtcclxuICAgICAgICAgICAgdmFyIGF1Z21lbnRlZFBhdGggPSB0aGlzLl9hdWdtZW50UGF0aChwYXRoLCBrZXkpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMuZmlsdGVyLmFwcGx5KHRoaXMsIFtrZXksIHZhbHVlLCBwYXRoXSkpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9hcnJheShrZXksIHZhbHVlLCBhdWdtZW50ZWRQYXRoLCBwYXJlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodXRpbHMuaXNPYmplY3QodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29iamVjdChrZXksIHZhbHVlLCBhdWdtZW50ZWRQYXRoLCBwYXJlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoJC5pc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9zY2FsYXIoa2V5LCB2YWx1ZSwgYXVnbWVudGVkUGF0aCwgcGFyZW50LCB0aGlzLl9vcHRpb25zLm9uRnVuY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NjYWxhcihrZXksIHZhbHVlLCBhdWdtZW50ZWRQYXRoLCBwYXJlbnQsIHRoaXMuX29wdGlvbnMub25QcmltaXRpdmUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIF9vYmplY3Q6IGZ1bmN0aW9uKGtleSwgb2JqLCBwYXRoLCBwYXJlbnQpIHtcclxuICAgICAgICAgICAgdmFyIHByb2NlZWQgPSB0aGlzLl9zY2FsYXIoa2V5LCBvYmosIHBhdGgsIHBhcmVudCwgdGhpcy5fb3B0aW9ucy5vbk9iamVjdCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChwcm9jZWVkICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgY2hpbGRLZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHV0aWxzLmhhc093blByb3BlcnR5KG9iaiwgY2hpbGRLZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2NlZWQgPSB0aGlzLl9uZXh0KGNoaWxkS2V5LCBvYmpbY2hpbGRLZXldLCBwYXRoLCBvYmopO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2NlZWQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHByb2NlZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBfYXJyYXk6IGZ1bmN0aW9uKGtleSwgYXJyYXksIHBhdGgsIHBhcmVudCkge1xyXG4gICAgICAgICAgICB2YXIgcHJvY2VlZCA9IHRoaXMuX3NjYWxhcihrZXksIGFycmF5LCBwYXRoLCBwYXJlbnQsIHRoaXMuX29wdGlvbnMub25BcnJheSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChwcm9jZWVkICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHVud3JhcHBlZEFycmF5ID0ga28udXRpbHMucGVla09ic2VydmFibGUoYXJyYXkpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBtYXggPSB1bndyYXBwZWRBcnJheS5sZW5ndGg7IGkgPCBtYXg7IGkgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb2NlZWQgPSB0aGlzLl9uZXh0KFwiaVwiLCB1bndyYXBwZWRBcnJheVtpXSwgcGF0aCwgYXJyYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZWVkID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBwcm9jZWVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgX3NjYWxhcjogZnVuY3Rpb24oa2V5LCB2YWx1ZSwgcGF0aCwgcGFyZW50LCBoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24oaGFuZGxlcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcmdzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBwYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogcGFyZW50LFxyXG4gICAgICAgICAgICAgICAgICAgIG9iajogdGhpcy5fY3VycmVudFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIuY2FsbCh0aGlzLl9jb250ZXh0LCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgX2lzQXJyYXk6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0ga28udXRpbHMucGVla09ic2VydmFibGUodmFsdWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gJC5pc0FycmF5KHZhbHVlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIF9hdWdtZW50UGF0aDogZnVuY3Rpb24oYWN0dWFsUGF0aCwgbmV3UGFydCkge1xyXG4gICAgICAgICAgICBpZiAoYWN0dWFsUGF0aCA9PT0gXCIvXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhY3R1YWxQYXRoICsgbmV3UGFydDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIGFjdHVhbFBhdGggKyBcIi9cIiArIG5ld1BhcnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgU2hlbGJ5LlBhcnNlci5leHRlbmQgPSBleHRlbmQ7XHJcbn0pKFNoZWxieS5leHRlbmQsXHJcbiAgIFNoZWxieS51dGlscyk7XHJcblxyXG4vLyBTaGVsYnkuRmlsdGVyc1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbihmdW5jdGlvbihuYW1lc3BhY2UsIGV4dGVuZCwgdXRpbHMpIHtcclxuICAgIFNoZWxieS5GaWx0ZXJzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB9O1xyXG5cclxuICAgIFNoZWxieS5GaWx0ZXJzLnByb3RvdHlwZSA9IHtcclxuICAgICAgICBnZXRFeHRlbmRhYmxlUHJvcGVydHlGaWx0ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gT2JqZWN0IG11c3QgYmUgYWRkZWQgdG8gdGhlIGZpbHRlciwgb3RoZXJ3aXNlIGlmIHRoZXkgYXJlIHJlamVjdGVkLCB0aGVpciBjaGlsZCBwcm9wZXJ0aWVzIHdvdWxkIGJlIGlnbm9yZWQuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5ICE9PSBuYW1lc3BhY2UgJiYgKGtvLmlzT2JzZXJ2YWJsZSh2YWx1ZSkgfHwgdXRpbHMuaXNPYmplY3QodmFsdWUpKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBnZXRFeHRlbmRlZFByb3BlcnR5RmlsdGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIE9iamVjdCBtdXN0IGJlIGFkZGVkIHRvIHRoZSBmaWx0ZXIsIG90aGVyd2lzZSBpZiB0aGV5IGFyZSByZWplY3RlZCwgdGhlaXIgY2hpbGQgcHJvcGVydGllcyB3b3VsZCBiZSBpZ25vcmVkLlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleSAhPT0gbmFtZXNwYWNlICYmICgoa28uaXNPYnNlcnZhYmxlKHZhbHVlKSB8fCB1dGlscy5pc09iamVjdCh2YWx1ZSkpICYmIHV0aWxzLmlzSW1wbGVtZW50aW5nU2hlbGJ5KHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZ2V0UGF0aEZpbHRlcjogZnVuY3Rpb24oaW5jbHVkZVBhdGhzLCBleGNsdWRlUGF0aHMpIHtcclxuICAgICAgICAgICAgaWYgKCQuaXNBcnJheShpbmNsdWRlUGF0aHMpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0SW5jbHVkZVBhdGhGaWx0ZXIoaW5jbHVkZVBhdGhzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICgkLmlzQXJyYXkoZXhjbHVkZVBhdGhzKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldEV4Y2x1ZGVQYXRoRmlsdGVyKGV4Y2x1ZGVQYXRocyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0RGVmYXVsdFBhdGhGaWx0ZXIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF9nZXRJbmNsdWRlUGF0aEZpbHRlcjogZnVuY3Rpb24ocGF0aHMpIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgZXZhbHVhdG9ycyA9IHRoaXMuX2NvbXB1dGVFdmFsdWF0b3JzKHBhdGhzKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHZhciBoYXNJbXBlcmZlY3RNYXRjaCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjb21wYXJlciA9IGZ1bmN0aW9uKGV2YWx1YXRvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGV2YWx1YXRvcihwYXRoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVG8gc3VwcG9ydCBhbnkgb3JkZXIgZm9yIHRoZSBpbmNsdXNpb24gZmlsdGVycywgd2UgbG9vcCB1bnRpbCB3ZSBmaW5kIGEgcGVyZmVjdCBcclxuICAgICAgICAgICAgICAgICAgICAvLyBtYXRjaC4gVGhpcyB3aWxsIHN1cHBvcnQgYSBjYXNlIHdoZXJlIGFuIGFycmF5IGl0ZW0gZmlsdGVyIGlzIHNwZWNpZmllZCBiZWZvcmUgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYW4gaW5jbHVzaW9uIGZpbHRlciBvbiB0aGUgYXJyYXkgaXRzZWxmLlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuaXNWYWxpZCAmJiAhcmVzdWx0LmlzUGVyZmVjdE1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhc0ltcGVyZmVjdE1hdGNoID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuaXNWYWxpZDtcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHV0aWxzLmFycmF5SW5kZXhPZihldmFsdWF0b3JzLCBwYXRoLCBjb21wYXJlcikgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0ltcGVyZmVjdE1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9jcmVhdGVJbXBlcmZlY3RNYXRjaEV2YWx1YXRpb25SZXN1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9jcmVhdGVJbnZhbGlkRXZhbHVhdGlvblJlc3VsdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2dldEV4Y2x1ZGVQYXRoRmlsdGVyOiBmdW5jdGlvbihwYXRocykge1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgICAgIHZhciBldmFsdWF0b3JzID0gdGhpcy5fY29tcHV0ZUV2YWx1YXRvcnMocGF0aHMpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHBhdGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wYXJlciA9IGZ1bmN0aW9uKGV2YWx1YXRvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBldmFsdWF0b3IocGF0aCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuaXNWYWxpZCAmJiByZXN1bHQuaXNQZXJmZWN0TWF0Y2g7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh1dGlscy5hcnJheUluZGV4T2YoZXZhbHVhdG9ycywgcGF0aCwgY29tcGFyZXIpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9jcmVhdGVQZXJmZWN0TWF0Y2hFdmFsdWF0aW9uUmVzdWx0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX2NyZWF0ZUludmFsaWRFdmFsdWF0aW9uUmVzdWx0KCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2dldERlZmF1bHRQYXRoRmlsdGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX2NyZWF0ZVBlcmZlY3RNYXRjaEV2YWx1YXRpb25SZXN1bHQoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfY29tcHV0ZUV2YWx1YXRvcnM6IGZ1bmN0aW9uKHBhdGhzKSB7XHJcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hcnJheU1hcChwYXRocywgZnVuY3Rpb24ocGF0aCkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHBhdGggbWF0Y2hpbmcgYXJyYXkgaXRlbXMsIGNyZWF0ZSBhIGZ1bmN0aW9uIHRoYXQgdXNlIGEgcmVndWxhciBleHByZXNzaW9uIHRvIG1hdGNoIHRoZSBjdXJyZW50IHBhdGhzIHJlcHJlc2VudGluZyBhcnJheSBpdGVtcyBwcm9wZXJ0aWVzLFxyXG4gICAgICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGNyZWF0ZSBhIGZ1bmN0aW9uIHRoYXQgdXNlIHRoZSBlcXVhbGl0eSBvcGVyYXRvciB0byBtYXRjaCB0aGUgY3VycmVudCBwYXRocyBhZ2FpbnN0IHRoZSBwYXRoLlxyXG4gICAgICAgICAgICAgICAgaWYgKHV0aWxzLnN0cmluZ0VuZHNXaXRoKHBhdGgsIFwiL2lcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUcmFuc2Zvcm0gXCIvaVwiIGludG8gcmVnZXggZXhwcmVzc2lvbiBbXl0rIChtZWFucyB0aGF0IGV2ZXJ5dGhpbmcgaXMgYWNjZXB0ZWQpLlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXR0ZXJuID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybiA9IG5ldyBSZWdFeHAocGF0aC5yZXBsYWNlKC9cXC9pL2csIFwiW15dK1wiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElFOCBjYXVzZSBhIFJlZ0V4cEVycm9yIGV4Y2VwdGlvbiB3aGVuIHRoZSAnXScgY2hhcmFjdGVyIGlzIG5vdCBlc2NhcGVkLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuID0gbmV3IFJlZ0V4cChwYXRoLnJlcGxhY2UoL1xcL2kvZywgXCJbXl1dK1wiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY3VycmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0dGVybi50ZXN0KGN1cnJlbnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fY3JlYXRlUGVyZmVjdE1hdGNoRXZhbHVhdGlvblJlc3VsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoYXQuX2lzQXJyYXlQYXRoKHBhdGgsIGN1cnJlbnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fY3JlYXRlSW1wZXJmZWN0TWF0Y2hFdmFsdWF0aW9uUmVzdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0Ll9jcmVhdGVJbnZhbGlkRXZhbHVhdGlvblJlc3VsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY3VycmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0aCA9PT0gY3VycmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX2NyZWF0ZVBlcmZlY3RNYXRjaEV2YWx1YXRpb25SZXN1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGF0Ll9pc0FycmF5UGF0aChwYXRoLCBjdXJyZW50KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXQuX2NyZWF0ZUltcGVyZmVjdE1hdGNoRXZhbHVhdGlvblJlc3VsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhhdC5fY3JlYXRlSW52YWxpZEV2YWx1YXRpb25SZXN1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfY3JlYXRlSW52YWxpZEV2YWx1YXRpb25SZXN1bHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlRXZhbHVhdGlvblJlc3VsdChmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF9jcmVhdGVJbXBlcmZlY3RNYXRjaEV2YWx1YXRpb25SZXN1bHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlRXZhbHVhdGlvblJlc3VsdCh0cnVlLCBmYWxzZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2NyZWF0ZVBlcmZlY3RNYXRjaEV2YWx1YXRpb25SZXN1bHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlRXZhbHVhdGlvblJlc3VsdCh0cnVlLCB0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfY3JlYXRlRXZhbHVhdGlvblJlc3VsdDogZnVuY3Rpb24oaXNWYWxpZCwgaXNQZXJmZWN0TWF0Y2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIGlzVmFsaWQ6IGlzVmFsaWQsXHJcbiAgICAgICAgICAgICAgICBpc1BlcmZlY3RNYXRjaDogaXNQZXJmZWN0TWF0Y2hcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfaXNBcnJheVBhdGg6IGZ1bmN0aW9uKHBhdGgsIGN1cnJlbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBhdGguaW5kZXhPZihjdXJyZW50ICsgXCIvaVwiKSAhPT0gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBTaGVsYnkuRmlsdGVycy5leHRlbmQgPSBleHRlbmQ7XHJcbn0pKFNoZWxieS5uYW1lc3BhY2UsXHJcbiAgIFNoZWxieS5leHRlbmQsXHJcbiAgIFNoZWxieS51dGlscyk7XHJcblxyXG4vLyBTaGVsYnkuRXh0ZW5kZXJzIC0gQ29yZVxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbihmdW5jdGlvbihuYW1lc3BhY2UsIGV4dGVuZCwgdXRpbHMsIGZhY3RvcnkpIHtcclxuICAgIHZhciBQcm9wZXJ0eVR5cGUgPSBTaGVsYnkuUHJvcGVydHlUeXBlID0ge1xyXG4gICAgICAgIE9iamVjdDogMCxcclxuICAgICAgICBBcnJheTogMSxcclxuICAgICAgICBTY2FsYXI6IDJcclxuICAgIH07XHJcblxyXG4gICAgU2hlbGJ5LkV4dGVuZGVycyA9IHtcclxuICAgIH07XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBcclxuICAgIFNoZWxieS5FeHRlbmRlcnMuYmFzZSA9IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgIGlmICh1dGlscy5pc051bGwodGhpcy5fdGFyZ2V0KSkge1xyXG4gICAgICAgICAgICB0aGlzLl90YXJnZXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0YXJnZXQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgU2hlbGJ5LkV4dGVuZGVycy5iYXNlLmV4dGVuZCA9IGV4dGVuZDtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBTaGVsYnkuUHJvcGVydHlFeHRlbmRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgU2hlbGJ5LlByb3BlcnR5RXh0ZW5kZXIucHJvdG90eXBlID0ge1xyXG4gICAgICAgIGFkZDogZnVuY3Rpb24odGFyZ2V0LCBleHRlbmRlcnMpIHtcclxuICAgICAgICAgICAgaWYgKHV0aWxzLmlzTnVsbCh0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcXFwidGFyZ2V0XFxcIiBtdXN0IGJlIGFuIG9iamVjdC5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh1dGlscy5pc051bGwoZXh0ZW5kZXJzKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiXFxcImV4dGVuZGVyc1xcXCIgbXVzdCBiZSBhbiBvYmplY3QgbGl0ZXJhbC5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgLy8gUHJldmVudCBtdWx0aXBsZSBleHRlbmRzLlxyXG4gICAgICAgICAgICBpZiAoIXV0aWxzLmhhc1Byb3BlcnR5KHRhcmdldCwgbmFtZXNwYWNlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX2V4dGVuZFByb3BlcnR5KHByb3BlcnR5LCB0eXBlLCBleHRlbmRlcnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBJdGVyYXRlIG9uIHRoZSB0YXJnZXQgcHJvcGVydGllcyB0byBleHRlbmQgYWxsIHRoZSBvYmplY3RzIGFuZCBvYnNlcnZhYmxlcyBtYXRjaGluZyBjcml0ZXJpYXMuXHJcbiAgICAgICAgICAgICAgICBmYWN0b3J5LnBhcnNlcigpLnBhcnNlKHRhcmdldCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogZmFjdG9yeS5maWx0ZXJzKCkuZ2V0RXh0ZW5kYWJsZVByb3BlcnR5RmlsdGVyKCksXHJcbiAgICAgICAgICAgICAgICAgICAgb25PYmplY3Q6IGFjdGlvbihQcm9wZXJ0eVR5cGUuT2JqZWN0KSxcclxuICAgICAgICAgICAgICAgICAgICBvbkFycmF5OiBhY3Rpb24oUHJvcGVydHlUeXBlLkFycmF5KSxcclxuICAgICAgICAgICAgICAgICAgICBvbkZ1bmN0aW9uOiBhY3Rpb24oUHJvcGVydHlUeXBlLlNjYWxhcilcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlxcXCJ0YXJnZXRcXFwiIG11c3QgYmUgYW4gb2JqZWN0LlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBwcm9wZXJ0eS52YWx1ZVtuYW1lc3BhY2VdO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJdGVyYXRlIG9uIHRoZSB0YXJnZXQgcHJvcGVydGllcyB0byByZW1vdmUgc2hlbGJ5IGV4dGVuZGVycy5cclxuICAgICAgICAgICAgZmFjdG9yeS5wYXJzZXIoKS5wYXJzZSh0YXJnZXQsIHtcclxuICAgICAgICAgICAgICAgIGZpbHRlcjogZmFjdG9yeS5maWx0ZXJzKCkuZ2V0RXh0ZW5kZWRQcm9wZXJ0eUZpbHRlcigpLFxyXG4gICAgICAgICAgICAgICAgb25PYmplY3Q6IGFjdGlvbixcclxuICAgICAgICAgICAgICAgIG9uQXJyYXk6IGFjdGlvbixcclxuICAgICAgICAgICAgICAgIG9uRnVuY3Rpb246IGFjdGlvblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIF9leHRlbmRQcm9wZXJ0eTogZnVuY3Rpb24ocHJvcGVydHksIHR5cGUsIGV4dGVuZGVycykge1xyXG4gICAgICAgICAgICBwcm9wZXJ0eS52YWx1ZVtuYW1lc3BhY2VdID0ge307XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFJldHJpZXZlIGFsbCB0aGUgZXh0ZW5kZXJzIHRvIGFwcGx5LiBUaGlzIGlzIGRvbmUgYnkgZG9pbmcgYSBjb25jYXRlbmF0aW9uXHJcbiAgICAgICAgICAgIC8vIG9mIHRoZSBcImNvbW1vblwiIGV4dGVuZGVycyB3aGljaCBhcmUgZGVmaW5lZCBpbiB0aGUgXCIqXCIgcHJvcGVydHkgYW5kIHNwZWNpZmljc1xyXG4gICAgICAgICAgICAvLyBleHRlbmRlcnMgd2hpY2ggYXJlIGRlZmluZWQgaW4gYSBwcm9wZXJ0eSBtYXRjaGluZyB0aGUgY3VycmVudCBwcm9wZXJ0eSBwYXRoLlxyXG4gICAgICAgICAgICB2YXIgcHJvcGVydHlFeHRlbmRlcnMgPSBleHRlbmRlcnNbXCIqXCJdIHx8IHt9O1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHV0aWxzLmlzT2JqZWN0KGV4dGVuZGVyc1twcm9wZXJ0eS5wYXRoXSkpIHtcclxuICAgICAgICAgICAgICAgICQuZXh0ZW5kKHByb3BlcnR5RXh0ZW5kZXJzLCBleHRlbmRlcnNbcHJvcGVydHkucGF0aF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBBcHBseSB0aGUgcmV0cmlldmVkIGV4dGVuZGVycy5cclxuICAgICAgICAgICAgJC5lYWNoKHByb3BlcnR5RXh0ZW5kZXJzLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwbHkodGhpcywgW3Byb3BlcnR5LnZhbHVlLCB0eXBlXSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIFNoZWxieS5Qcm9wZXJ0eUV4dGVuZGVyLmV4dGVuZCA9IGV4dGVuZDtcclxufSkoU2hlbGJ5Lm5hbWVzcGFjZSxcclxuICAgU2hlbGJ5LmV4dGVuZCxcclxuICAgU2hlbGJ5LnV0aWxzLFxyXG4gICBTaGVsYnkuRmFjdG9yeS5pbnN0YW5jZSk7XHJcblxyXG4vLyBTaGVsYnkuRXh0ZW5kZXJzIC0gU3Vic2NyaWJlXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKG5hbWVzcGFjZSwgZXh0ZW5kLCB1dGlscywgZmFjdG9yeSwgUHJvcGVydHlUeXBlKSB7XHJcbiAgICBrby5leHRlbmRlcnMuc2hlbGJ5U3Vic2NyaWJlID0gZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgICAgLy8gV2hlbiB0cnVlLCBhbGwgdGhlIHN1YnNjcmlwdGlvbnMgYXJlIHBhdXNlLlxyXG4gICAgICAgIHZhciBwYXVzZUFsbFN1YnNjcmlwdGlvbnMgPSBmYWxzZTtcclxuICAgICAgICBcclxuICAgICAgICAkLmV4dGVuZCh0YXJnZXRbbmFtZXNwYWNlXSwge1xyXG4gICAgICAgICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uKGNhbGxiYWNrIC8qLCBbY2FsbGJhY2tUYXJnZXRdLCBbZXZlbnRdICovKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoISQuaXNGdW5jdGlvbihjYWxsYmFjaykpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBhcmd1bWVudCBtdXN0IGJlIGEgY2FsbGJhY2sgZnVuY3Rpb24uXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cclxuICAgICAgICAgICAgICAgIC8vIE11c3Qga2VlcCBhIGxvY2FsbHkgc2NvcGVkIHZhcmlhYmxlIG9mIHRoZSBjYWxsYmFjayBvdGhlcndpc2UgSUUgOCBhbmQgOSBjYXVzZSBzdGFja1xyXG4gICAgICAgICAgICAgICAgLy8gb3ZlcmZsb3cgZXJyb3IuXHJcbiAgICAgICAgICAgICAgICB2YXIgb3JpZ2luYWxDYWxsYmFjayA9IGNhbGxiYWNrO1xyXG5cclxuICAgICAgICAgICAgICAgIGFyZ3VtZW50c1swXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXVzZUFsbFN1YnNjcmlwdGlvbnMgJiYgIXBhdXNhYmxlU3Vic2NyaXB0aW9uLmlzUGF1c2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBvYnNlcnZhYmxlIGlzIG5vdCBwYXVzZWQgZ2xvYmFsbHkgb3IgdGhpcyBzdWJzY3JpcHRpb24gaXMgbm90IHBhdXNlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FsbCB0aGUgb3JpZ2luYWwgY2FsbGJhY2sgd2l0aCB0aGUgb3JpZ2luYWwgYXJndW1lbnRzLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbENhbGxiYWNrLmFwcGx5KHRoaXMsIFt2YWx1ZV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENhbGwgdGhlIG9yaWdpbmFsIGtub2Nrb3V0IHN1YnNjcmlwdGlvbiBmdW5jdGlvbi5cclxuICAgICAgICAgICAgICAgIHZhciBzdWJzY3JpcHRpb24gPSB0YXJnZXQuc3Vic2NyaWJlLmFwcGx5KHRhcmdldCwgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdmFyIHBhdXNhYmxlU3Vic2NyaXB0aW9uID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlzUGF1c2U6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgcGF1c2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzUGF1c2UgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdW1lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1BhdXNlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBkaXNwb3NlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF1c2FibGVTdWJzY3JpcHRpb247XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBwYXVzZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBwYXVzZUFsbFN1YnNjcmlwdGlvbnMgPSB0cnVlO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVzdW1lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHBhdXNlQWxsU3Vic2NyaXB0aW9ucyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaXNQYXVzZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF1c2VBbGxTdWJzY3JpcHRpb25zO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcclxuICAgIH07XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAga28uZXh0ZW5kZXJzLnNoZWxieUFycmF5U3Vic2NyaWJlID0gZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgICAgdmFyIG9yaWdpbmFsU3Vic2NyaWJlID0gdGFyZ2V0W25hbWVzcGFjZV0uc3Vic2NyaWJlO1xyXG5cclxuICAgICAgICBpZiAoISQuaXNGdW5jdGlvbihvcmlnaW5hbFN1YnNjcmliZSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIG9ic2VydmFibGUgbXVzdCBiZSBleHRlbmRlZCB3aXRoIFxcXCJrby5leHRlbmRlcnMuc2hlbGJ5U3Vic2NyaWJlXFxcIi5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkLmV4dGVuZCh0YXJnZXRbbmFtZXNwYWNlXSwge1xyXG4gICAgICAgICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uKGNhbGxiYWNrIC8qLCBbY2FsbGJhY2tUYXJnZXRdLCBbZXZlbnRdLCBbb3B0aW9uc10gKi8pIHtcclxuICAgICAgICAgICAgICAgIHZhciBldmFsdWF0ZUNoYW5nZXMgPSAhdXRpbHMuaXNPYmplY3QoYXJndW1lbnRzWzNdKSB8fCBhcmd1bWVudHNbM10uZXZhbHVhdGVDaGFuZ2VzICE9PSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXZhbHVhdGVDaGFuZ2VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEkLmlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBjYWxsYmFjayBmdW5jdGlvbi5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTXVzdCBrZWVwIGEgbG9jYWxseSBzY29wZWQgdmFyaWFibGUgb2YgdGhlIGNhbGxiYWNrIG90aGVyd2lzZSBJRSA4IGFuZCA5IGNhdXNlIHN0YWNrXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb3ZlcmZsb3cgZXJyb3IuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9yaWdpbmFsQ2FsbGJhY2sgPSBjYWxsYmFjaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUHJveHkgY2FsbGJhY2sgZnVuY3Rpb24gYWRkaW5nIHRoZSBhcnJheSBjaGFuZ2VzIGJlaGF2aW9yLlxyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50c1swXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsQ2FsbGJhY2suYXBwbHkodGhpcywgW3sgdmFsdWU6IHZhbHVlIH0sIHRydWUsIFwic2hlbGJ5QXJyYXlTdWJzY3JpYmVcIl0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRvIGFjdGl2YXRlIHRoZSBuYXRpdmUgYXJyYXkgY2hhbmdlcyBldmFsdWF0aW9uLCB0aGUgZXZlbnQgbXVzdCBiZSBcImFycmF5Q2hhbmdlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIHRoZSBzdGFuZGFyZCBvYnNlcnZhYmxlIHN1YnNjcmlwdGlvbiBiZWhhdmlvdXIgaXMgYXBwbGllZC5cclxuICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHNbMl0gPSBcImFycmF5Q2hhbmdlXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIHN1YnNjcmlwdGlvbi5cclxuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbFN1YnNjcmliZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIFNoZWxieS5FeHRlbmRlcnMuc3Vic2NyaWJlID0gZnVuY3Rpb24odGFyZ2V0LCB0eXBlKSB7XHJcbiAgICAgICAgLy8gQXBwbHkgdGhlIG9ic2VydmFibGUgZXh0ZW5kZXJzIHRvIGV2ZXJ5dGhpbmcgdGhhdCBpcyBhbiBvYnNlcnZhYmxlLlxyXG4gICAgICAgIGlmICh0eXBlICE9PSBQcm9wZXJ0eVR5cGUuT2JqZWN0KSB7XHJcbiAgICAgICAgICAgIHRhcmdldC5leHRlbmQodGhpcy5fb2JzZXJ2YWJsZUV4dGVuZGVyc1tcIipcIl0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT09IFByb3BlcnR5VHlwZS5BcnJheSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5RXh0ZW5kZXJzID0gdGhpcy5fb2JzZXJ2YWJsZUV4dGVuZGVyc1tcImFycmF5XCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghdXRpbHMuaXNOdWxsKGFycmF5RXh0ZW5kZXJzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5leHRlbmQoYXJyYXlFeHRlbmRlcnMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0YXJnZXRbbmFtZXNwYWNlXS5fc3Vic2NyaXB0aW9ucyA9IHt9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZSA9PT0gUHJvcGVydHlUeXBlLk9iamVjdCkge1xyXG4gICAgICAgICAgICAvLyBDb3B5IGFsbCB0aGUgZnVuY3Rpb25zIHRvIHRoZSB0YXJnZXQuXHJcbiAgICAgICAgICAgICQuZXh0ZW5kKHRhcmdldFtuYW1lc3BhY2VdLCBuZXcgU2hlbGJ5LkV4dGVuZGVycy5zdWJzY3JpYmUuX2N0b3IodGFyZ2V0KSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgU2hlbGJ5LkV4dGVuZGVycy5zdWJzY3JpYmUuX2N0b3IgPSBTaGVsYnkuRXh0ZW5kZXJzLmJhc2UuZXh0ZW5kKHtcclxuICAgICAgICBfaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RlbGVnYXRlZFN1YnNjcmlwdGlvbnMgPSB7fTtcclxuICAgICAgICB9LFxyXG4gICAgXHJcbiAgICAgICAgc3Vic2NyaWJlOiBmdW5jdGlvbihjYWxsYmFjaywgb3B0aW9ucykge1xyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiXFxcImNhbGxiYWNrXFxcIiBtdXN0IGJlIGEgZnVuY3Rpb24uXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICAgICAgb3B0aW9ucy5hcnJheSA9IG9wdGlvbnMuYXJyYXkgfHwge307XHJcblxyXG4gICAgICAgICAgICB2YXIgcHJvcGVydHlGaWx0ZXIgPSBmYWN0b3J5LmZpbHRlcnMoKS5nZXRQYXRoRmlsdGVyKG9wdGlvbnMuaW5jbHVkZSwgb3B0aW9ucy5leGNsdWRlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBzdWJzY3JpcHRpb24gPSB7XHJcbiAgICAgICAgICAgICAgICAvLyBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgc3Vic2NyaXB0aW9uLlxyXG4gICAgICAgICAgICAgICAgaWQ6IHV0aWxzLmdlbmVyYXRlR3VpZCgpLFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBBcnJheSBoYXZpbmcgYWxsIHRoZSBtZW1iZXJzIG9mIHRoZSBzdWJzY3JpcHRpb25zLlxyXG4gICAgICAgICAgICAgICAgbWVtYmVyczogW10sXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFRydWUgaWYgdGhlIHN1YnNjcmlwdGlvbiBpcyBwYXVzZWQsIGZhbHNlIG90aGVyd2lzZS5cclxuICAgICAgICAgICAgICAgIGlzUGF1c2U6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBUaGUgb3JpZ2luYWwgc3Vic2NyaXB0aW9uIGNhbGxiYWNrIHByb3ZpZGVkIGJ5IHRoZSBjYWxsZXIuXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHBhdXNlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9wYXVzZVN1YnNjcmlwdGlvbih0aGlzKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICByZXN1bWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX3Jlc3VtZVN1YnNjcmlwdGlvbih0aGlzKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBkaXNwb3NlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9kaXNwb3NlU3Vic2NyaXB0aW9uKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gQWRkIHRoZSBjdXJyZW50IG9iamVjdCBwcm9wZXJ0aWVzIHRvIHRoZSBzdWJzY3JpcHRpb25zLlxyXG4gICAgICAgICAgICB0aGlzLl9hZGRUb1N1YnNjcmlwdGlvbih0aGlzLl90YXJnZXQoKSwgc3Vic2NyaXB0aW9uLCBwcm9wZXJ0eUZpbHRlciwgb3B0aW9ucywgeyBwYXRoOiBcIlwiIH0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gSWYgYXQgbGVhc3QgYSBwcm9wZXJ0eSBoYXMgYmVlbiBzdWJzY3JpYmVkIHRvLCBzYXZlIHRoZSBzdWJzY3JpcHRpb24gZGF0YSBmb3IgZnVydGhlciBvcGVyYXRpb25zIHRoYXQgaGFuZGxlc1xyXG4gICAgICAgICAgICAvLyBtdWx0aXBsZSBzdWJzY3JpcHRpb25zIGxpa2UgXCJ1bnN1Y3JpYmVBbGxcIiwgXCJtdXRlXCIgYW5kIFwicmVzdW1lXCIuXHJcbiAgICAgICAgICAgIGlmIChzdWJzY3JpcHRpb24ubWVtYmVycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kZWxlZ2F0ZWRTdWJzY3JpcHRpb25zW3N1YnNjcmlwdGlvbi5pZF0gPSBzdWJzY3JpcHRpb247XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2FkZFRvU3Vic2NyaXB0aW9uOiBmdW5jdGlvbih0YXJnZXQsIHN1YnNjcmlwdGlvbiwgcHJvcGVydHlFdmFsdWF0b3IsIG9wdGlvbnMsIGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICAvLyBIYW5kbGVyIGNhbGxlZCB0byBzdWJzY3JpYmUgdG8gYSBwcm9wZXJ0eS5cclxuICAgICAgICAgICAgdmFyIHN1YnNjcmliZXIgPSAkLmlzRnVuY3Rpb24ob3B0aW9ucy5zdWJzY3JpYmVyKSA/IG9wdGlvbnMuc3Vic2NyaWJlciA6IHRoaXMuX3Byb3BlcnR5U3Vic2NyaWJlcjtcclxuICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBNdXN0IGRvIHRoaXMgY2hlY2sgYmVjYXVzZSBvZiB0aGUgYXV0b21hdGljIHN1YnNjcmlwdGlvbiBvZiBhcnJheSdzIG5ldyBpdGVtcy5cclxuICAgICAgICAgICAgICAgIGlmICh1dGlscy5pc0ltcGxlbWVudGluZ1NoZWxieShwcm9wZXJ0eS52YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBNdXN0IGNvbnNpZGVyIGEgY29udGV4dHVhbCBwYXRoIGFuZCBwYXJlbnQgdG8gZnVsbHkgc3VwcG9ydCB0aGUgYXV0b21hdGljIHN1YnNjcmlwdGlvbiBvZiBhcnJheSdzIG5ldyBpdGVtcy5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aCA9IHByb3BlcnR5LnBhdGggPT09IFwiL1wiICYmICF1dGlscy5pc051bGxPckVtcHR5KGNvbnRleHQucGF0aCkgPyBjb250ZXh0LnBhdGggOiBjb250ZXh0LnBhdGggKyBwcm9wZXJ0eS5wYXRoO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBwcm9wZXJ0eS5wYXRoID09PSBcIi9cIiAmJiAhdXRpbHMuaXNOdWxsKGNvbnRleHQucGFyZW50KSA/IGNvbnRleHQucGFyZW50IDogcHJvcGVydHkucGFyZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBldmFsdWF0aW9uUmVzdWx0ID0gcHJvcGVydHlFdmFsdWF0b3IocGF0aCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEV2ZW4gaWYgdGhpcyBpcyBub3QgYSBwZXJmZWN0IG1hdGNoLCB0aGVyZSBpcyBjYXNlcyAobGlrZSBhcnJheXMpIHdoZW4gd2Ugd2FudCB0byBhZGQgYSBzdWJzY3JpcHRpb25cclxuICAgICAgICAgICAgICAgICAgICAvLyB0byB0aGUgcHJvcGVydHkgdG8gaGFuZGxlIHNwZWNpYWwgYmVoYXZpb3VycyAobGlrZSBpdGVtJ3MgYXV0b21hdGljIHN1YnNjcmlwdGlvbnMgZm9yIGFycmF5cykuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2YWx1YXRpb25SZXN1bHQuaXNWYWxpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBYnN0cmFjdGlvbiB0byBhZGQgYWRkaXRpb25hbCBpbmZvcm1hdGlvbnMgd2hlbiBhIHN1YnNjcmlwdGlvbiBpcyB0cmlnZ2VyZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm94eUNhbGxiYWNrID0gZnVuY3Rpb24odmFsdWUsIGV4dGVuZEFyZ3VtZW50cywgZXh0ZW5kZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBwYXJlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uOiBzdWJzY3JpcHRpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdpdmUgeW91IG1vcmUgZmxleGliaWxpdHkgZm9yIHRoZSBzdWJzY3JpcHRpb24gYXJndW1lbnRzIGlmIHlvdSBkZWNpZGUgdG8gd3JpdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEgY3VzdG9tIGV4dGVuZGVyIGFuZCB1c2UgaXQgdGhyb3VnaCB0aGUgXCJzdWJzY3JpYmVyXCIgb3B0aW9uIGJ5IGxldHRpbmcgeW91IGV4dGVuZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGFyZ3VtZW50cyB0aGF0IGFyZSBwYXNzZWQgdG8gdGhlIHN1YnNjcmliZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZChhcmdzLCBleHRlbmRBcmd1bWVudHMgPT09IHRydWUgPyB2YWx1ZSA6IHsgdmFsdWU6IHZhbHVlIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHRlbmRlciA9PT0gXCJzaGVsYnlBcnJheVN1YnNjcmliZVwiICYmIG9wdGlvbnMuYXJyYXkudHJhY2tDaGlsZHJlbiAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2godmFsdWUudmFsdWUsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IFwiYWRkZWRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgYSBjdXN0b20gZXh0ZW5kZXIgaW5kaWNhdGUgdGhhdCBhbiBpdGVtIGlzIGFkZGVkIHRvIGFuIGFycmF5LCBhdXRvbWF0aWNhbGx5IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3Vic2NyaWJlIHRvIHRoYXQgbmV3IGl0ZW0uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9hZGRUb1N1YnNjcmlwdGlvbih0aGlzLnZhbHVlLCBzdWJzY3JpcHRpb24sIHByb3BlcnR5RXZhbHVhdG9yLCBvcHRpb25zLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogdXRpbHMuc3RyaW5nRW5zdXJlRW5kc1dpdGgocGF0aCwgXCIvXCIpICsgXCJpXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBwcm9wZXJ0eS52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5zdGF0dXMgPT09IFwiZGVsZXRlZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBhIGN1c3RvbSBleHRlbmRlciBpbmRpY2F0ZSB0aGF0IGFuIGl0ZW0gaXMgcmVtb3ZlZCBmcm9tIGFuIGFycmF5LCBhdXRvbWF0aWNhbGx5IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGlzcG9zZSBhbGwgdGhlIHN1YnNjcmlwdGlvbnMgb3duZWQgYnkgdGhhdCBpdGVtLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fcmVtb3ZlRnJvbVN1YnNjcmlwdGlvbih0aGlzLnZhbHVlLCBzdWJzY3JpcHRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2YWx1YXRpb25SZXN1bHQuaXNQZXJmZWN0TWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOb3RpZnkgc3Vic2NyaWJlcnMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmNhbGxiYWNrLmNhbGwodGhpcywgYXJncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTdWJzY3JpYmUgdG8gdGhlIHByb3BlcnR5LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlTdWJzY3JpcHRpb24gPSBzdWJzY3JpYmVyKHByb3BlcnR5LCBwcm94eUNhbGxiYWNrLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIHByb3BlcnR5IHN1YnNjcmlwdGlvbiBvbiB0aGUgcHJvcGVydHkgaXRzZWxmLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eS52YWx1ZVtuYW1lc3BhY2VdLl9zdWJzY3JpcHRpb25zW3N1YnNjcmlwdGlvbi5pZF0gPSBwcm9wZXJ0eVN1YnNjcmlwdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgcHJvcGVydHkgdG8gdGhlIGdyb3VwLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ubWVtYmVycy5wdXNoKHByb3BlcnR5LnZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJdGVyYXRlIG9uIHRoZSB0YXJnZXQgcHJvcGVydGllcyB0byBzdWJzY3JpYmUgb24gYWxsIHRoZSBvYnNlcnZhYmxlcyBtYXRjaGluZyBjcml0ZXJpYXMuXHJcbiAgICAgICAgICAgIGZhY3RvcnkucGFyc2VyKCkucGFyc2UodGFyZ2V0LCB7XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IGZhY3RvcnkuZmlsdGVycygpLmdldEV4dGVuZGVkUHJvcGVydHlGaWx0ZXIoKSxcclxuICAgICAgICAgICAgICAgIG9uQXJyYXk6IGFjdGlvbixcclxuICAgICAgICAgICAgICAgIG9uRnVuY3Rpb246IGFjdGlvblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIF9yZW1vdmVGcm9tU3Vic2NyaXB0aW9uOiBmdW5jdGlvbih0YXJnZXQsIHN1YnNjcmlwdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eVN1YnNjcmlwdGlvbiA9IHByb3BlcnR5LnZhbHVlW25hbWVzcGFjZV0uX3N1YnNjcmlwdGlvbnNbc3Vic2NyaXB0aW9uLmlkXTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCF1dGlscy5pc051bGwocHJvcGVydHlTdWJzY3JpcHRpb24pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRGlzcG9zZSBLTyBzdWJzY3JpcHRpb24uXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlTdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgc3Vic2NyaXB0aW9ucyBmcm9tIHRoZSByZXBvc2l0b3J5LlxyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBwcm9wZXJ0eS52YWx1ZVtuYW1lc3BhY2VdLl9zdWJzY3JpcHRpb25zW3N1YnNjcmlwdGlvbi5pZF07XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBwcm9wZXJ0eSBmcm9tIHRoZSBncm91cC5cclxuICAgICAgICAgICAgICAgICAgICB1dGlscy5hcnJheVJlbW92ZVZhbHVlKHN1YnNjcmlwdGlvbi5tZW1iZXJzLCBwcm9wZXJ0eS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEl0ZXJhdGUgb24gdGhlIHRhcmdldCBwcm9wZXJ0aWVzIHRvIGRpc3Bvc2UgdGhlIHN1YnNjcmlwdGlvbnMgZnJvbSBhbGwgdGhlIG9ic2VydmFibGVzIG1hdGNoaW5nIGNyaXRlcmlhcy5cclxuICAgICAgICAgICAgZmFjdG9yeS5wYXJzZXIoKS5wYXJzZSh0YXJnZXQsIHtcclxuICAgICAgICAgICAgICAgIGZpbHRlcjogZmFjdG9yeS5maWx0ZXJzKCkuZ2V0RXh0ZW5kZWRQcm9wZXJ0eUZpbHRlcigpLFxyXG4gICAgICAgICAgICAgICAgb25BcnJheTogYWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgb25GdW5jdGlvbjogYWN0aW9uXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgX3Byb3BlcnR5U3Vic2NyaWJlcjogZnVuY3Rpb24ocHJvcGVydHksIGNhbGxiYWNrLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciBzdWJzY3JpcHRpb25PcHRpb25zID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIC8vIEluIGNhc2Ugb2YgYW4gYXJyYXksIGlmIGEgc3BlY2lmaWMgZXZlbnQgaGFzIGJlZW4gc3BlY2lmaWVkLCB0aGUgYXJyYXkgY2hhbmdlcyBldmFsdWF0aW9uXHJcbiAgICAgICAgICAgIC8vIHdpbGwgbm90IGJlIGFwcGxpZWQuXHJcbiAgICAgICAgICAgIGlmICgkLmlzQXJyYXkocHJvcGVydHkudmFsdWUucGVlaygpKSAmJiAob3B0aW9ucy5hcnJheS5ldmFsdWF0ZUNoYW5nZXMgPT09IGZhbHNlIHx8ICF1dGlscy5pc051bGxPckVtcHR5KG9wdGlvbnMuZXZlbnQpKSkgeyBcclxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbk9wdGlvbnMgPSB7IGV2YWx1YXRlQ2hhbmdlczogZmFsc2UgfTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5LnZhbHVlW25hbWVzcGFjZV0uc3Vic2NyaWJlKGNhbGxiYWNrLCBvcHRpb25zLmNhbGxiYWNrVGFyZ2V0LCBvcHRpb25zLmV2ZW50LCBzdWJzY3JpcHRpb25PcHRpb25zKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIF9wYXVzZVN1YnNjcmlwdGlvbjogZnVuY3Rpb24oc3Vic2NyaXB0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2V4ZWN1dGVTdWJzY3JpcHRpb25PcGVyYXRpb24oc3Vic2NyaXB0aW9uLCBmdW5jdGlvbihwcm9wZXJ0eVN1YnNjcmlwdGlvbikge1xyXG4gICAgICAgICAgICAgICAgcHJvcGVydHlTdWJzY3JpcHRpb24ucGF1c2UoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBzdWJzY3JpcHRpb24uaXNQYXVzZSA9IHRydWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBfcmVzdW1lU3Vic2NyaXB0aW9uOiBmdW5jdGlvbihzdWJzY3JpcHRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5fZXhlY3V0ZVN1YnNjcmlwdGlvbk9wZXJhdGlvbihzdWJzY3JpcHRpb24sIGZ1bmN0aW9uKHByb3BlcnR5U3Vic2NyaXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eVN1YnNjcmlwdGlvbi5yZXN1bWUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBzdWJzY3JpcHRpb24uaXNQYXVzZSA9IGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgX2Rpc3Bvc2VTdWJzY3JpcHRpb246IGZ1bmN0aW9uKHN1YnNjcmlwdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLl9leGVjdXRlU3Vic2NyaXB0aW9uT3BlcmF0aW9uKHN1YnNjcmlwdGlvbiwgZnVuY3Rpb24ocHJvcGVydHlTdWJzY3JpcHRpb24pIHtcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5U3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB1dGlscy5hcnJheUNsZWFyKHN1YnNjcmlwdGlvbi5tZW1iZXJzKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kZWxlZ2F0ZWRTdWJzY3JpcHRpb25zW3N1YnNjcmlwdGlvbi5pZF07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBfZXhlY3V0ZVN1YnNjcmlwdGlvbk9wZXJhdGlvbjogZnVuY3Rpb24oc3Vic2NyaXB0aW9uLCBhY3Rpb24pIHtcclxuICAgICAgICAgICAgJC5lYWNoKHN1YnNjcmlwdGlvbi5tZW1iZXJzLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eVN1YnNjcmlwdGlvbiA9IHRoaXNbbmFtZXNwYWNlXS5fc3Vic2NyaXB0aW9uc1tzdWJzY3JpcHRpb24uaWRdO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIXV0aWxzLmlzTnVsbChwcm9wZXJ0eVN1YnNjcmlwdGlvbikpIHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24ocHJvcGVydHlTdWJzY3JpcHRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIERpc3Bvc2Ugb2YgYWxsIHRoZSBzdWJzY3JpcHRpb25zLlxyXG4gICAgICAgIHVuc3VzY3JpYmVBbGw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgICQuZWFjaCh0aGlzLl9kZWxlZ2F0ZWRTdWJzY3JpcHRpb25zLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuX2Rpc3Bvc2VTdWJzY3JpcHRpb24odGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUGF1c2UgYWxsIHRoZSBzdWJzY3JpcHRpb25zLlxyXG4gICAgICAgIG11dGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgICQuZWFjaCh0aGlzLl9kZWxlZ2F0ZWRTdWJzY3JpcHRpb25zLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuX3BhdXNlU3Vic2NyaXB0aW9uKHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFJlc3VtZSBhbGwgdGhlIHN1YnNjcmlwdGlvbnMuXHJcbiAgICAgICAgdW5tdXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICAkLmVhY2godGhpcy5fZGVsZWdhdGVkU3Vic2NyaXB0aW9ucywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0Ll9yZXN1bWVTdWJzY3JpcHRpb24odGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICBTaGVsYnkuRXh0ZW5kZXJzLnN1YnNjcmliZS5fY3Rvci5leHRlbmQgPSBleHRlbmQ7XHJcbiAgICBcclxuICAgIFNoZWxieS5FeHRlbmRlcnMuc3Vic2NyaWJlLl9vYnNlcnZhYmxlRXh0ZW5kZXJzID0geyBcclxuICAgICAgICBcIipcIjoge1xyXG4gICAgICAgICAgICBzaGVsYnlTdWJzY3JpYmU6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiYXJyYXlcIjoge1xyXG4gICAgICAgICAgICBzaGVsYnlBcnJheVN1YnNjcmliZTogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0pKFNoZWxieS5uYW1lc3BhY2UsIFxyXG4gICBTaGVsYnkuZXh0ZW5kLFxyXG4gICBTaGVsYnkudXRpbHMsXHJcbiAgIFNoZWxieS5GYWN0b3J5Lmluc3RhbmNlLFxyXG4gICBTaGVsYnkuUHJvcGVydHlUeXBlKTtcclxuXHJcbi8vIFNoZWxieS5FeHRlbmRlcnMgLSBFZGl0XHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKG5hbWVzcGFjZSwgZXh0ZW5kLCB1dGlscywgZmFjdG9yeSwgUHJvcGVydHlUeXBlKSB7XHJcbiAgICBrby5leHRlbmRlcnMuc2hlbGJ5RWRpdCA9IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgIGlmICghJC5pc0Z1bmN0aW9uKHRhcmdldFtuYW1lc3BhY2VdLnBhdXNlKSB8fCAhJC5pc0Z1bmN0aW9uKHRhcmdldFtuYW1lc3BhY2VdLnJlc3VtZSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHV0aWxzLnN0cmluZ0Zvcm1hdChcIlxcXCJzaGVsYnlFZGl0YWJsZVxcXCIgY2FuIG9ubHkgZXh0ZW5kcyBhbiBvYnNlcnZhYmxlIGhhdmluZyBcXFwiezF9LnBhdXNlXFxcIiBhbmQgXFxcInsxfS5yZXN1bWVcXFwiIGZ1bmN0aW9ucy5cIiwgbmFtZXNwYWNlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgd2FzUGF1c2UgPSBmYWxzZTtcclxuICAgIFxyXG4gICAgICAgICQuZXh0ZW5kKHRhcmdldFtuYW1lc3BhY2VdLCB7XHJcbiAgICAgICAgICAgIGN1cnJlbnQ6IHRhcmdldC5wZWVrKCksXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBoYXNNdXRhdGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgaXNFZGl0aW5nOiBmYWxzZSxcclxuICAgICAgICAgICAgZGVmZXJOb3RpZmljYXRpb25zOiBmYWxzZSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGJlZ2luRWRpdDogZnVuY3Rpb24oZGVmZXJOb3RpZmljYXRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNFZGl0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gdGFyZ2V0LnBlZWsoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlZmVyTm90aWZpY2F0aW9ucyA9IGRlZmVyTm90aWZpY2F0aW9ucyAhPT0gZmFsc2UgPyB0cnVlIDogZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRlZmVyTm90aWZpY2F0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBNdXN0IGtlZXAgdHJhY2sgb2YgdGhlIHN1YnNjcmlwdGlvbiBcInBhdXNlXCIgc3RhdHVzIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGVkaXRpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG8gcHJldmVudCByZXN1bWluZyB0aGUgc3Vic2NyaXB0aW9uIGF0IHRoZSBlbmQgb2YgdGhlIGVkaXRpb24gaWYgaXQgd2FzIG9yaWdpbmFsbHkgcGF1c2UuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhc1BhdXNlID0gdGFyZ2V0W25hbWVzcGFjZV0uaXNQYXVzZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF3YXNQYXVzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJldmVudCB0aGUgcHJvcGFnYXRpb24gb2YgdGhlIG5vdGlmaWNhdGlvbnMgdG8gc3Vic2NyaWJlcnMgYmVmb3JlIGFuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBleHBsaWNpdCBjYWxsIHRvIFwiZW5kRWRpdFwiIGZ1bmN0aW9uIGhhcyBiZWVuIG1hZGUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbbmFtZXNwYWNlXS5wYXVzZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBTdGFydCBlZGl0aW9uLlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNFZGl0aW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVuZEVkaXQ6IGZ1bmN0aW9uKGNhbk5vdGlmeSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzRWRpdGluZyAmJiB0aGlzLmhhc011dGF0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSB0YXJnZXQucGVlaygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXdhc1BhdXNlICYmIHRoaXMuZGVmZXJOb3RpZmljYXRpb25zICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaGFzTXV0YXRlZCA9IHRoYXQuaGFzTXV0YXRlZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlZmVyIHRoZSBcInJlc3VtZVwiIHRvIHByZXZlbnQgc3luY2hyb25pemF0aW9uIHByb2JsZW0gd2l0aCB0aGUgVUkuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbbmFtZXNwYWNlXS5yZXN1bWUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuIHRoZSBub3RpZmljYXRpb25zIGFyZSByZXN1bWVkLCBpZiB0aGUgb2JzZXJ2YWJsZSBoYXMgYmVlbiBlZGl0ZWQgYW5kIHRoZSBtdXRlIG9wdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlzIG5vdCBzcGVjaWZpZWQsIGZvcmNlIGEgbm90aWZpY2F0aW9uIHNpbmNlIHRoZSBwcmV2aW91cyBub3RpZmljYXRpb25zIGhhcyBiZWVuIFwiZWF0XCIgYmVjYXVzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIG5vdGlmaWNhdGlvbnMgd2VyZSBwYXVzZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzTXV0YXRlZCAmJiBjYW5Ob3RpZnkgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnZhbHVlV2lsbE11dGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldC52YWx1ZUhhc011dGF0ZWQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhc011dGF0ZWQgPSBmYWxzZTsgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0VkaXRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIHJlc2V0RWRpdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcgJiYgdGhpcy5oYXNNdXRhdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0KHRoaXMuY3VycmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjYW5jZWxFZGl0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lc3BhY2VdLnJlc2V0RWRpdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzRWRpdGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghd2FzUGF1c2UgJiYgdGhpcy5kZWZlck5vdGlmaWNhdGlvbnMgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlZmVyIHRoZSBcInJlc3VtZVwiIHRvIHByZXZlbnQgc3luY2hyb25pemF0aW9uIHByb2JsZW0gd2l0aCB0aGUgVUkuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbbmFtZXNwYWNlXS5yZXN1bWUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0VkaXRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFzTXV0YXRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGFyZ2V0LnN1YnNjcmliZShmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoIXV0aWxzLmlzTnVsbCh0YXJnZXRbbmFtZXNwYWNlXSkgJiYgdGFyZ2V0W25hbWVzcGFjZV0uaXNFZGl0aW5nICYmICF0YXJnZXRbbmFtZXNwYWNlXS5oYXNNdXRhdGVkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lc3BhY2VdLmhhc011dGF0ZWQgPSBrby51dGlscy5jb21wYXJlQXJyYXlzKHRhcmdldFtuYW1lc3BhY2VdLmN1cnJlbnQsIHZhbHVlKS5sZW5ndGggPT09IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRbbmFtZXNwYWNlXS5oYXNNdXRhdGVkID0gdmFsdWUgIT09IHRhcmdldFtuYW1lc3BhY2VdLmN1cnJlbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICBTaGVsYnkuRXh0ZW5kZXJzLmVkaXQgPSBmdW5jdGlvbih0YXJnZXQsIHR5cGUpIHtcclxuICAgICAgICBpZiAodHlwZSAhPT0gUHJvcGVydHlUeXBlLk9iamVjdCkge1xyXG4gICAgICAgICAgICB0YXJnZXQuZXh0ZW5kKHRoaXMuX29ic2VydmFibGVFeHRlbmRlcnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAodHlwZSA9PT0gUHJvcGVydHlUeXBlLk9iamVjdCkge1xyXG4gICAgICAgICAgICAvLyBDb3B5IGFsbCB0aGUgZnVuY3Rpb25zIHRvIHRoZSB0YXJnZXQuXHJcbiAgICAgICAgICAgICQuZXh0ZW5kKHRhcmdldFtuYW1lc3BhY2VdLCBuZXcgU2hlbGJ5LkV4dGVuZGVycy5lZGl0Ll9jdG9yKHRhcmdldCkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIFNoZWxieS5FeHRlbmRlcnMuZWRpdC5fY3RvciA9IFNoZWxieS5FeHRlbmRlcnMuYmFzZS5leHRlbmQoe1xyXG4gICAgICAgIF9pbml0aWFsaXplOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdGhpcy5pc0VkaXRpbmcgPSBmYWxzZTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgLy8gT3B0aW9ucyBmb3IgdGhlIGN1cnJlbnQgZWRpdGlvbi4gXHJcbiAgICAgICAgICAgIC8vIFRoZSBvYmplY3Qgc3RydWN0dXJlIGlzOlxyXG4gICAgICAgICAgICAvLyAgLSBpbmNsdWRlOiBBbiBhcnJheSBvZiBwcm9wZXJ0eSBwYXRocyB0aGF0IHdpbGwgY29tcG9zZSB0aGUgZWRpdGlvbi5cclxuICAgICAgICAgICAgLy8gIC0gZXhjbHVkZTogQW4gYXJyYXkgb2YgcHJvcGVydHkgcGF0aHMgdGhhdCB3aWxsIGJlIGV4Y2x1ZGUgZnJvbSB0aGUgZWRpdGlvbi5cclxuICAgICAgICAgICAgdGhpcy5fZWRpdE9wdGlvbnMgPSBudWxsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgYmVnaW5FZGl0OiBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0VkaXRpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2VkaXRPcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9leGVjdXRlRWRpdEFjdGlvbihmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5LnZhbHVlW25hbWVzcGFjZV0uYmVnaW5FZGl0KHRoaXMuX2VkaXRPcHRpb25zLmRlZmVyTm90aWZpY2F0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0VkaXRpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZW5kRWRpdDogZnVuY3Rpb24obm90aWZ5T25jZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcpIHtcclxuICAgICAgICAgICAgICAgIC8vIEV2YWx1YXRvciB0aGF0IGhhbmRsZXMgdGhlIG5vdGlmaWNhdGlvbnMgY291bnQgb3B0aW9uLlxyXG4gICAgICAgICAgICAgICAgdmFyIGNhbk5vdGlmeSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmIChub3RpZnlPbmNlID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2VkaXRPcHRpb25zLmRlZmVyTm90aWZpY2F0aW9ucyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgXFxcIm5vdGlmeSBvbmNlXFxcIiBvcHRpb25zIGlzIG5vdCBzdXBwb3J0ZWQgd2hlbiB0aGUgZWRpdGlvbiBoYXMgYmVlbiBzdGFydGVkIHdpdGggdGhlIFxcXCJkZWZlciBub3RpZmljYXRpb25zXFxcIiBkaXNhYmxlZC5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYW5Ob3RpZnkgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmNvdW50ID09PSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjYW5Ob3RpZnkgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbiA9IGZ1bmN0aW9uKHByb3BlcnR5LCBjb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5LnZhbHVlW25hbWVzcGFjZV0uaXNFZGl0aW5nID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eS52YWx1ZVtuYW1lc3BhY2VdLmhhc011dGF0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuY291bnQgKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkudmFsdWVbbmFtZXNwYWNlXS5lbmRFZGl0KGNhbk5vdGlmeShjb250ZXh0KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9leGVjdXRlRWRpdEFjdGlvbihhY3Rpb24sIHtcclxuICAgICAgICAgICAgICAgICAgICBjb3VudDogMFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNFZGl0aW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZXNldEVkaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2V4ZWN1dGVFZGl0QWN0aW9uKGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5LnZhbHVlW25hbWVzcGFjZV0uaXNFZGl0aW5nID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5LnZhbHVlW25hbWVzcGFjZV0ucmVzZXRFZGl0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNhbmNlbEVkaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2V4ZWN1dGVFZGl0QWN0aW9uKGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5LnZhbHVlW25hbWVzcGFjZV0uaXNFZGl0aW5nID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5LnZhbHVlW25hbWVzcGFjZV0uY2FuY2VsRWRpdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzRWRpdGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBoYXNNdXRhdGVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHJldCA9IGZhbHNlO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2V4ZWN1dGVFZGl0QWN0aW9uKGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5LnZhbHVlW25hbWVzcGFjZV0uaGFzTXV0YXRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgX2V4ZWN1dGVFZGl0QWN0aW9uOiBmdW5jdGlvbihhY3Rpb24sIGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgLy8gRmlsdGVyIHRoYXQgaGFuZGxlcyB0aGUgaW5jbHVkZSAvIGV4Y2x1ZGUgb3B0aW9ucyBieSBldmFsdWF0aW5nIHRoZSBwcm9wZXJ0eVxyXG4gICAgICAgICAgICAvLyBwYXRocyBhZ2FpbnN0IHRoZSBzcGVjaWZpZWQgb3B0aW9ucyBhbmQgZmlsdGVyIG91dCB0aGUgcGF0aHMgdGhhdCBkb2Vzbid0IG1hdGNoIHRoZSBcclxuICAgICAgICAgICAgLy8gb3B0aW9ucy5cclxuICAgICAgICAgICAgdmFyIHByb3BlcnR5RXZhbHVhdG9yID0gZmFjdG9yeS5maWx0ZXJzKCkuZ2V0UGF0aEZpbHRlcih0aGlzLl9lZGl0T3B0aW9ucy5pbmNsdWRlLCB0aGlzLl9lZGl0T3B0aW9ucy5leGNsdWRlKTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGV4ZWN1dGUgPSBmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5RXZhbHVhdG9yKHByb3BlcnR5LnBhdGgpLmlzUGVyZmVjdE1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjdGlvbi5hcHBseSh0aGF0LCBbcHJvcGVydHksIGNvbnRleHRdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgLy8gSXRlcmF0ZSBvbiB0aGUgdGFyZ2V0IHByb3BlcnRpZXMgdG8gZXhlY3V0ZSB0aGUgYWN0aW9uIG9uIGFsbCB0aGUgb2JzZXJ2YWJsZXMgbWF0Y2hpbmcgY3JpdGVyaWFzLlxyXG4gICAgICAgICAgICBmYWN0b3J5LnBhcnNlcigpLnBhcnNlKHRoaXMuX3RhcmdldCgpLCB7XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IGZhY3RvcnkuZmlsdGVycygpLmdldEV4dGVuZGVkUHJvcGVydHlGaWx0ZXIoKSxcclxuICAgICAgICAgICAgICAgIG9uQXJyYXk6IGV4ZWN1dGUsXHJcbiAgICAgICAgICAgICAgICBvbkZ1bmN0aW9uOiBleGVjdXRlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICBTaGVsYnkuRXh0ZW5kZXJzLmVkaXQuX2N0b3IuZXh0ZW5kID0gZXh0ZW5kO1xyXG4gICAgXHJcbiAgICBTaGVsYnkuRXh0ZW5kZXJzLmVkaXQuX29ic2VydmFibGVFeHRlbmRlcnMgPSB7XHJcbiAgICAgICAgc2hlbGJ5RWRpdDogdHJ1ZVxyXG4gICAgfTtcclxufSkoU2hlbGJ5Lm5hbWVzcGFjZSxcclxuICAgU2hlbGJ5LmV4dGVuZCxcclxuICAgU2hlbGJ5LnV0aWxzLFxyXG4gICBTaGVsYnkuRmFjdG9yeS5pbnN0YW5jZSxcclxuICAgU2hlbGJ5LlByb3BlcnR5VHlwZSk7XHJcblxyXG4vLyBTaGVsYnkuRXh0ZW5kZXJzIC0gVXRpbGl0eVxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbihmdW5jdGlvbihuYW1lc3BhY2UsIGV4dGVuZCwgdXRpbHMsIGZhY3RvcnksIFByb3BlcnR5VHlwZSkge1xyXG4gICAgU2hlbGJ5LkV4dGVuZGVycy51dGlsaXR5ID0gZnVuY3Rpb24odGFyZ2V0LCB0eXBlKSB7XHJcbiAgICAgICAgaWYgKHR5cGUgIT09IFByb3BlcnR5VHlwZS5TY2FsYXIpIHtcclxuICAgICAgICAgICAgLy8gQ29weSBhbGwgdGhlIGZ1bmN0aW9ucyB0byB0aGUgdGFyZ2V0LlxyXG4gICAgICAgICAgICAkLmV4dGVuZCh0YXJnZXRbbmFtZXNwYWNlXSwgbmV3IFNoZWxieS5FeHRlbmRlcnMudXRpbGl0eS5fY3Rvcih0YXJnZXQpKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBTaGVsYnkuRXh0ZW5kZXJzLnV0aWxpdHkuX2N0b3IgPSBTaGVsYnkuRXh0ZW5kZXJzLmJhc2UuZXh0ZW5kKHtcclxuICAgICAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IG51bGw7XHJcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0ge307XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNPYmplY3QoYXJndW1lbnRzWzFdKSkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBhcmd1bWVudHNbMF07XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gYXJndW1lbnRzWzFdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHV0aWxzLmlzT2JqZWN0KGFyZ3VtZW50c1swXSkpIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbMF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gYXJndW1lbnRzWzBdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICAgIGlmICh1dGlscy5oYXNQcm9wZXJ0eShvcHRpb25zLCBwcm9wZXJ0eS5wYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5LnZhbHVlKG9wdGlvbnNbcHJvcGVydHkucGF0aF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkudmFsdWUodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJdGVyYXRlIG9uIHRoZSB0YXJnZXQgcHJvcGVydGllcyB0byByZXNldCBhbGwgdGhlIG9ic2VydmFibGVzIG1hdGNoaW5nIGNyaXRlcmlhcy5cclxuICAgICAgICAgICAgZmFjdG9yeS5wYXJzZXIoKS5wYXJzZSh0aGlzLl90YXJnZXQoKSwge1xyXG4gICAgICAgICAgICAgICAgZmlsdGVyOiBmYWN0b3J5LmZpbHRlcnMoKS5nZXRFeHRlbmRlZFByb3BlcnR5RmlsdGVyKCksXHJcbiAgICAgICAgICAgICAgICBvbkZ1bmN0aW9uOiBhY3Rpb25cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICB1cGRhdGVGcm9tOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICAgICAgaWYgKCF1dGlscy5pc09iamVjdChvYmopKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcXFwib2JqXFxcIiBtdXN0IGJlIGFuIG9iamVjdC5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBmYWN0b3J5Lm1hcHBlcigpLnVwZGF0ZSh0aGlzLl90YXJnZXQoKSwgb2JqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgdXBkYXRpbmcgdGhlIHRhcmdldCBvYmplY3QuIE1ha2Ugc3VyZSB0aGF0IGFsbCB0aGUgb2JzZXJ2YWJsZXMgcHJvcGVydGllcyBvZiB0aGUgdGFyZ2V0IG9iamVjdCBoYXMgYmVlbiBjcmVhdGVkIGJ5IHRoZSBTaGVsYnkgbWFwcGVyLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICBTaGVsYnkuRXh0ZW5kZXJzLnV0aWxpdHkuX2N0b3IuZXh0ZW5kID0gZXh0ZW5kO1xyXG59KShTaGVsYnkubmFtZXNwYWNlLCBcclxuICAgU2hlbGJ5LmV4dGVuZCxcclxuICAgU2hlbGJ5LnV0aWxzLFxyXG4gICBTaGVsYnkuRmFjdG9yeS5pbnN0YW5jZSxcclxuICAgU2hlbGJ5LlByb3BlcnR5VHlwZSk7XHJcblxyXG4vLyBTaGVsYnkuQWpheFxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbihmdW5jdGlvbihkZWJ1ZywgZXh0ZW5kLCB1dGlscykge1xyXG4gICAgdmFyIEFqYXggPSBTaGVsYnkuQWpheCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgfTtcclxuXHJcbiAgICBBamF4LnByb3RvdHlwZSA9IHtcclxuICAgICAgICAvLyBTZW5kIGFuIEFKQVggcmVxdWVzdC5cclxuICAgICAgICAvLyAgLSBvcHRpb25zOiBBbnkgalF1ZXJ5IEFKQVggb3B0aW9ucyAoaHR0cDovL2FwaS5qcXVlcnkuY29tL2pRdWVyeS5hamF4KSxcclxuICAgICAgICAvLyAgICBvcHRpb25zIFwidXJsXCIgYW5kIFwidHlwZVwiIGFyZSBtYW5kYXRvcnkuXHJcbiAgICAgICAgc2VuZDogZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsKG9wdGlvbnMpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcXFwib3B0aW9uc1xcXCIgbXVzdCBiZSBhIG5vbiBudWxsIG9iamVjdCBsaXRlcmFsLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHV0aWxzLmlzTnVsbE9yRW1wdHkob3B0aW9ucy51cmwpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcXFwib3B0aW9ucy51cmxcXFwiIG11c3QgYmUgYSBub24gbnVsbCBvciBlbXB0eSBzdHJpbmcuXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsT3JFbXB0eShvcHRpb25zLnR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcXFwib3B0aW9ucy50eXBlXFxcIiBtdXN0IGJlIGEgbm9uIG51bGwgb3IgZW1wdHkgc3RyaW5nLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIG1lcmdlZE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgJC5hamF4U2V0dGluZ3MsIEFqYXgub3B0aW9ucywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIHZhciBoYXNEYXRhID0gdXRpbHMuaXNPYmplY3Qob3B0aW9ucy5kYXRhKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghaGFzRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgbWVyZ2VkT3B0aW9ucy5jb250ZW50VHlwZSA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy50eXBlICE9PSBcIkdFVFwiICYmIGhhc0RhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmICh1dGlscy5zdHJpbmdDb250YWlucyhtZXJnZWRPcHRpb25zLmNvbnRlbnRUeXBlLCBcImFwcGxpY2F0aW9uL2pzb25cIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXJnZWRPcHRpb25zLmRhdGEgPSBKU09OLnN0cmluZ2lmeShtZXJnZWRPcHRpb25zLmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIganF4aHIgPSAkLmFqYXgobWVyZ2VkT3B0aW9ucyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoZGVidWcgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIGpxeGhyLmZhaWwodGhpcy5fb25SZXF1ZXN0RmFpbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBqcXhocjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIF9vblJlcXVlc3RGYWlsOiBmdW5jdGlvbihqcXhociwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHsgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gdXRpbHMuaXNOdWxsT3JFbXB0eSh0aGlzLmRhdGEpID8gXCJ7Tk9fREFUQX1cIiA6IEpTT04uc3RyaW5naWZ5KHRoaXMuZGF0YSk7XHJcbiAgICAgICAgICAgIHZhciBleGNlcHRpb24gPSB1dGlscy5pc051bGxPckVtcHR5KHRleHRTdGF0dXMpID8gXCJ7Tk9fRVhDRVBUSU9OfVwiIDogdGV4dFN0YXR1cztcclxuICAgICAgICAgICAgdmFyIGh0dHBFcnJvciA9IHV0aWxzLmlzTnVsbE9yRW1wdHkoZXJyb3JUaHJvd24pID8gXCJ7Tk9fSFRUUF9FUlJPUn1cIiA6IGVycm9yVGhyb3duO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSB1dGlscy5zdHJpbmdGb3JtYXQoXHJcbiAgICAgICAgICAgICAgICBcIkFuIGVycm9yIG9jY3VycmVkIHdoaWxlIHBlcmZvcm1pbmcgYW4gQUpBWCByZXF1ZXN0IG9mIHR5cGUgezF9IHRvIHsyfSB3aXRoIGRhdGEgezN9LlxcblN0YXR1cyBjb2RlOiB7NH1cXG5TdGF0dXMgXCIgKyBcclxuICAgICAgICAgICAgICAgIFwidGV4dDogezV9XFxuRXhjZXB0aW9uOiB7Nn1cXG5IVFRQIGVycm9yOiB7N31cIixcclxuICAgICAgICAgICAgICAgIHRoaXMudHlwZSwgXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVybCwgXHJcbiAgICAgICAgICAgICAgICBkYXRhLCBcclxuICAgICAgICAgICAgICAgIGpxeGhyLnN0YXR1cywgXHJcbiAgICAgICAgICAgICAgICBqcXhoci5zdGF0dXNUZXh0LCBcclxuICAgICAgICAgICAgICAgIGV4Y2VwdGlvbiwgXHJcbiAgICAgICAgICAgICAgICBodHRwRXJyb3IpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdXRpbHMuZGVidWcobWVzc2FnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBCeSBkZWZhdWx0cyB0aGUgb3B0aW9ucyBhcmUgdGhlIGpRdWVyeSBBSkFYIGRlZmF1bHQgc2V0dGluZ3MgKGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheClcclxuICAgIC8vIHdpdGggYSBmZXcgZXhjZXB0aW9uczpcclxuICAgIC8vICAtIFJlcXVlc3RzIGFyZSBtYWRlIHVzaW5nIHRoZSBKU09OIGZvcm1hdC5cclxuICAgIC8vICAtIENhY2hpbmcgaXMgZGlzYWJsZWQuXHJcbiAgICBBamF4Lm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgJC5hamF4U2V0dGluZ3MsIHtcclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgY2FjaGU6IGZhbHNlXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgQWpheC5leHRlbmQgPSBleHRlbmQ7XHJcbn0pKFNoZWxieS5kZWJ1ZyxcclxuICAgU2hlbGJ5LmV4dGVuZCwgXHJcbiAgIFNoZWxieS51dGlscyk7XHJcblxyXG4vLyBTaGVsYnkuTWFwcGVyXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKGV4dGVuZCkge1xyXG4gICAgU2hlbGJ5Lk1hcHBlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgfTtcclxuXHJcbiAgICBTaGVsYnkuTWFwcGVyLnByb3RvdHlwZSA9IHtcclxuICAgICAgICBmcm9tSlM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4ga28udmlld21vZGVsLmZyb21Nb2RlbC5hcHBseShrby52aWV3bW9kZWwsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICB0b0pTOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGtvLnZpZXdtb2RlbC50b01vZGVsLmFwcGx5KGtvLnZpZXdtb2RlbCwgYXJndW1lbnRzKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBrby52aWV3bW9kZWwudXBkYXRlRnJvbU1vZGVsLmFwcGx5KGtvLnZpZXdtb2RlbCwgYXJndW1lbnRzKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBTaGVsYnkuTWFwcGVyLmV4dGVuZCA9IGV4dGVuZDtcclxufSkoU2hlbGJ5LmV4dGVuZCk7XHJcblxyXG4vLyBTaGVsYnkuVmlld01vZGVsXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuKGZ1bmN0aW9uKG5hbWVzcGFjZSwgZXh0ZW5kLCB1dGlscywgZmFjdG9yeSkge1xyXG4gICAgU2hlbGJ5LlZpZXdNb2RlbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBTaGVsYnkuVmlld01vZGVsLnByb3RvdHlwZSA9IHtcclxuICAgICAgICAvLyBNdXN0IGJlIG92ZXJyaWRlIGJ5IHlvdSB0byBzdXBwb3J0IFJFU1Qgb3IgUlBDIEhUVFAgcmVxdWVzdHMgZm9yIFxyXG4gICAgICAgIC8vIFwiYWxsXCIgLyBcImRldGFpbFwiIC8gXCJhZGRcIiAvIFwidXBkYXRlXCIgLyBcInJlbW92ZVwiIGZ1bmN0aW9ucy4gXHJcbiAgICAgICAgLy8gRm9yIFJFU1QgcmVxdWVzdHMsIFwiX3VybFwiIG11c3QgYmUgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBlbmRwb2ludCBVUkwuXHJcbiAgICAgICAgLy8gRm9yIFJQQyByZXF1ZXN0cywgXCJfdXJsXCIgbXVzdCBiZSBhbiBvYmplY3QgbGl0ZXJhbCBoYXZpbmcgdGhlIGZvbGxvd2luZyBzdHJ1Y3R1cmU6XHJcbiAgICAgICAgLy8gIC0gYWxsOiBcIkFMTF9VUkxcIixcclxuICAgICAgICAvLyAgLSBkZXRhaWw6IFwiREVUQUlMX1VSTFwiLFxyXG4gICAgICAgIC8vICAtIGFkZDogXCJBRERfVVJMXCIsXHJcbiAgICAgICAgLy8gIC0gdXBkYXRlOiBcIlVQREFURV9VUkxcIixcclxuICAgICAgICAvLyAgLSByZW1vdmU6IFwiUkVNT1ZFX1VSTFwiXHJcbiAgICAgICAgX3VybDogbnVsbCxcclxuICAgIFxyXG4gICAgICAgIC8vIFByb3h5IGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIGJlIG92ZXJyaWRlIGJ5IHlvdS4gXHJcbiAgICAgICAgLy8gSWYgZGVmaW5lZCwgaXQgd2lsbCBiZSBpbnZva2VkIHdoZW4gdGhlIG1vZGVsIGlzIGNyZWF0ZWQgYWZ0ZXIgYWxsIHRoZSBcclxuICAgICAgICAvLyBpbml0aWFsaXphdGlvbiBsb2dpYyBpcyBkb25lLlxyXG4gICAgICAgIF9pbml0aWFsaXplOiBudWxsLFxyXG4gICAgXHJcbiAgICAgICAgLy8gSWYgZGVmaW5lZCBieSB5b3UsIGl0IHdpbGwgYmUgaW52b2tlZCBiZWZvcmUgYmluZGluZyB0aGUgdmlldyBtb2RlbCB3aXRoIHRoZSBET00uIFxyXG4gICAgICAgIC8vIEJ5IGRlZmF1bHQsIHRoZSBiaW5kaW5ncyB3aWxsIGJlIGFwcGxpZWQgYWZ0ZXIgeW91ciBoYW5kbGVyIGV4ZWN1dGlvbiwgaWYgeW91IHdhbnQgdG8gZG8gYXN5bmNocm9ub3VzXHJcbiAgICAgICAgLy8gb3BlcmF0aW9ucyB5b3VyIGhhbmRsZXIgZnVuY3Rpb24gbXVzdCByZXR1cm4gdHJ1ZSBhbmQgdGhlbiBjYWxsIHRoZSBjYWxsYmFjayBmdW5jdGlvbiBwYXJhbWV0ZXIgXHJcbiAgICAgICAgLy8gd2hlbiB5b3VyIG9wZXJhdGlvbnMgYXJlIGNvbXBsZXRlZC5cclxuICAgICAgICAvLyAgLSBjYWxsYmFjazogQSBmdW5jdGlvbiB0aGF0IHlvdSBjYW4gY2FsbCB3aGVuIHlvdXIgYXN5bmNocm9ub3VzIG9wZXJhdGlvbnMgYXJlIGNvbXBsZXRlZC5cclxuICAgICAgICBfYmVmb3JlQmluZDogbnVsbCxcclxuICAgICAgICBfYmVmb3JlRmV0Y2g6IG51bGwsXHJcbiAgICAgICAgX2JlZm9yZVNhdmU6IG51bGwsXHJcbiAgICAgICAgX2JlZm9yZVJlbW92ZTogbnVsbCxcclxuXHJcbiAgICAgICAgX2FmdGVyQmluZDogbnVsbCxcclxuICAgICAgICBfYWZ0ZXJGZXRjaDogbnVsbCxcclxuICAgICAgICBfYWZ0ZXJTYXZlOiBudWxsLFxyXG4gICAgICAgIF9hZnRlclJlbW92ZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiBkZWZpbmVkIGJ5IHlvdSwgaXQgd2lsbCBiZSBpbnZva2VkIHdoZW4gYW4gaGFuZGxlZCBlcnJvciBvY2N1cnMuXHJcbiAgICAgICAgLy8gIC0gZGF0YTogQW4gb2JqZWN0IGxpdGVyYWwgaGF2aW5nIHRoZSBmb2xsb3dpbmcgc3RydWN0dXJlOlxyXG4gICAgICAgIC8vICAgIC0gZGF0YTogVGhlIGVycm9yIGRhdGEsIGl0IGNhbiBiZSBvZiBhbnkgdHlwZXMgZGVwZW5kaW5nIG9mIHRoZSBzb3VyY2Ugb2YgdGhlIGVycm9yLlxyXG4gICAgICAgIC8vICAgIC0gb3BlcmF0aW9uQ29udGV4dDogQW4gb2JqZWN0IGxpdGVyYWwgdGhhdHMgcmVwcmVzZW50cyB0aGUgY3VycmVudCBvcGVyYXRpb24uIFRoZSB0eXBlIG9mIHRoZSBvcGVyYXRpb24gY2FuIGJlIGlkZW50aWZpZWQgXHJcbiAgICAgICAgLy8gICAgICB3aXRoIHRoZSBwcm9wZXJ0eSBcInR5cGVcIiBhbmQgd2lsbCBtYXRjaCBhIHZhbHVlIG9mIHRoZSBcIlNoZWxieS5WaWV3TW9kZWwuT3BlcmF0aW9uVHlwZVwiIGVudW1lcmF0aW9uLlxyXG4gICAgICAgIC8vICAgICAgVGhlIG9iamVjdCBzdHJ1Y3R1cmUgd2lsbCBiZTpcclxuICAgICAgICAvLyAgICAgICAgLSBpZiBcInR5cGVcIiBpcyBTaGVsYnkuVmlld01vZGVsLk9wZXJhdGlvblR5cGUuQUpBWDogc2VlIFwiX2NyZWF0ZUFqYXhPcGVyYXRpb25Db250ZXh0XCIgZm9yIHRoZSBvYmplY3Qgc3RydWN0dXJlLlxyXG4gICAgICAgIC8vICAgICAgSW4gYWRkaXRpb24gdG8gdGhlIG9wZXJhdGlvbiBjb250ZXh0IHN0YW5kYXJkIG9wdGlvbiwgaW4gY2FzZSBvZiBhbiBlcnJvciB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXMgYXJlIGFkZGVkIHRvIHRoZSBvcGVyYXRpb24gY29udGV4dDpcclxuICAgICAgICAvLyAgICAgICAtIHN0YXR1c0NvZGU6IFRoZSByZXF1ZXN0IHN0YXR1cyBjb2RlICg0MDQsIDUwMSwgLi4uKS5cclxuICAgICAgICAvLyAgICAgICAtIHN0YXR1c1RleHQ6IFRoZSByZXF1ZXN0IHN0YXR1cyB0ZXh0LlxyXG4gICAgICAgIC8vICAgICAgIC0gZXhjZXB0aW9uOiBBbnkgc291cmNlIG9mIGV4Y2VwdGlvbi4gUG9zc2libGUgdmFsdWVzIGFyZTogbnVsbCwgXCJ0aW1lb3V0XCIsIFwiZXJyb3JcIiwgXCJhYm9ydFwiLCBvciBcInBhcnNlcmVycm9yXCIuXHJcbiAgICAgICAgX2hhbmRsZU9wZXJhdGlvbkVycm9yOiBudWxsLFxyXG5cclxuICAgICAgICBfaGFuZGxlT3BlcmF0aW9uU3VjY2VzczogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiBkZWZpbmVkIGJ5IHlvdSwgaXQgd2lsbCBiZSBpbnZva2VkIHdoZW4gZGlzcG9zaW5nIHRoZSB2aWV3IG1vZGVsLlxyXG4gICAgICAgIF9oYW5kbGVEaXNwb3NlOiBudWxsLFxyXG5cclxuICAgICAgICAvLyBBcHBseSB0aGUgS08gYmluZGluZ3Mgd2l0aCB0aGUgdmlldyBtb2RlbC5cclxuICAgICAgICAvLyAgLSBlbGVtZW50IDogYSBET00gb3IgalF1ZXJ5IGVsZW1lbnQgdG8gdXNlIGFzIHRoZSByb290LlxyXG4gICAgICAgIGJpbmQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSBuZXcgJC5EZWZlcnJlZCgpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGFwcGx5QmluZGluZ3MgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuX2FwcGx5QmluZGluZ3MoKTtcclxuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfTtcclxuXHRcdFxyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLl9nZXREb21FbGVtZW50KGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGlzLl9iZWZvcmVCaW5kKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzQXN5bmMgPSB0aGlzLl9iZWZvcmVCaW5kLmNhbGwodGhpcywgYXBwbHlCaW5kaW5ncyk7XHJcblx0XHRcdFx0XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNBc3luYyAhPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGx5QmluZGluZ3MoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFwcGx5QmluZGluZ3MoKTtcclxuICAgICAgICAgICAgfVxyXG5cdFx0XHRcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIF9nZXREb21FbGVtZW50OiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIGlmICh1dGlscy5pc2pRdWVyeUVsZW1lbnQoZWxlbWVudCkgJiYgZWxlbWVudC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudFswXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBfYXBwbHlCaW5kaW5nczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcywgdGhpcy5lbGVtZW50KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24odGhpcy5fYWZ0ZXJCaW5kKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYWZ0ZXJCaW5kLmNhbGwodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIF9mcm9tSlM6IGZ1bmN0aW9uKG9iaiwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHByb3BlcnRpZXMgdG8gb2JzZXJ2YWJsZXMuXHJcbiAgICAgICAgICAgIHZhciBtYXBwZWQgPSBmYWN0b3J5Lm1hcHBlcigpLmZyb21KUyhvYmosIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gRXh0ZW5kIGFsbCB0aGUgcHJvcGVydGllcy5cclxuICAgICAgICAgICAgdGhpcy5fYWRkRXh0ZW5kZXJzKG1hcHBlZCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gbWFwcGVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgX3RvSlM6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgICAgICAvLyBDb252ZXJ0IG9ic2VydmFibGVzIGJhY2sgdG8gcHJpbWl0aXZlIHZhbHVlcy5cclxuICAgICAgICAgICAgdmFyIHVubWFwcGVkID0gZmFjdG9yeS5tYXBwZXIoKS50b0pTKG9iaik7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGV4dGVuZGVycyBsZWZ0IG9uIHRoZSBwcm9wZXJ0aWVzIChleC4gb24gb2JqZWN0cykuXHJcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUV4dGVuZGVycyh1bm1hcHBlZCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gdW5tYXBwZWQ7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2FkZEV4dGVuZGVyczogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgICAgIGlmICh1dGlscy5vYmplY3RTaXplKHRoaXMuX2V4dGVuZGVycykgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBmYWN0b3J5LnByb3BlcnR5RXh0ZW5kZXIoKS5hZGQob2JqLCB0aGlzLl9leHRlbmRlcnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBfcmVtb3ZlRXh0ZW5kZXJzOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICAgICAgZmFjdG9yeS5wcm9wZXJ0eUV4dGVuZGVyKCkucmVtb3ZlKG9iaik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX3NlbmQ6IGZ1bmN0aW9uKG9wdGlvbnMsIGhhbmRsZXJzKSB7XHJcbiAgICAgICAgICAgIGlmICh1dGlscy5pc051bGxPckVtcHR5KG9wdGlvbnMucmVxdWVzdC51cmwpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcXFwib3B0aW9ucy5yZXF1ZXN0LnVybFxcXCIgbXVzdCBiZSBhIG5vbiBudWxsIG9yIGVtcHR5IHN0cmluZy5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSAkLmV4dGVuZCh7IGNvbnRleHQ6IHRoaXMgfSwgb3B0aW9ucy5yZXF1ZXN0KTtcclxuICAgICAgICAgICAgdmFyIG9wZXJhdGlvbkNvbnRleHQgPSB0aGlzLl9jcmVhdGVPcGVyYXRpb25Db250ZXh0KHJlcXVlc3QpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihoYW5kbGVycy5vbkJlZm9yZSkpIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3QuYmVmb3JlU2VuZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFByZXBlbmQgb3JpZ2luYWwgYXJndW1lbnRzIHdpdGggdGhlIG9wZXJhdGlvbiBjb250ZXh0LlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gJC5tYWtlQXJyYXkoYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgICAgICBhcmdzLnVuc2hpZnQob3BlcmF0aW9uQ29udGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIG9yaWdpbmFsIGpRdWVyeSBBSkFYIFwiYmVmb3JlU2VuZFwiIGZ1bmN0aW9uIHN1cHBvcnQgcmV0dXJuaW5nIFwiZmFsc2VcIiB0byBhYm9ydCB0aGVcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXF1ZXN0LCBhbGxvdyBhIHJldHVybiB2YWx1ZSB0byBzdXBwb3J0IHRoYXQgYmVoYXZpb3VyLlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoYW5kbGVycy5vbkJlZm9yZS5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIHJlcXVlc3QgZGF0YSBmcm9tIG9ic2VydmFibGVzIHRvIHBsYWluIG9iamVjdHMuXHJcbiAgICAgICAgICAgIGlmICh1dGlscy5pc09iamVjdChyZXF1ZXN0LmRhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSB0aGlzLl90b0pTKHJlcXVlc3QuZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEV4ZWN1dGUgdGhlIEFKQVggcmVxdWVzdC5cclxuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBmYWN0b3J5LmFqYXgoKS5zZW5kKHJlcXVlc3QpO1xyXG5cclxuICAgICAgICAgICAgLy8gVXNpbmcgYSBcInByb3h5XCIgZGVmZXJyZWQgdG8gYWRkIGN1c3RvbSBtYXBwaW5nIC8gZXJyb3IgaGFuZGxpbmcgbG9naWNzIHRocm91Z2ggXHJcbiAgICAgICAgICAgIC8vIHRoZSBBSkFYIHByb21pc2UgaGFuZGxlcnMuXHJcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcclxuXHJcbiAgICAgICAgICAgIHByb21pc2UuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF1dGlscy5pc051bGwocmVzcG9uc2UpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5yZXNwb25zZSA9IG9wdGlvbnMucmVzcG9uc2UgfHwge307XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBjYWxsZXIgZGlkIE5PVCBzcGVjaWZ5IHRvIE5PVCBwcm9jZXNzIHRoZSByZXNwb25zZSwgcHJvY2VzcyB0aGUgcmVzcG9uc2UuIFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlc3BvbnNlLnByb2Nlc3MgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob3B0aW9ucy5yZXNwb25zZS5leHRyYWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IG9wdGlvbnMucmVzcG9uc2UuZXh0cmFjdG9yLmNhbGwodGhpcywgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKGhhbmRsZXJzLm9uUmVzcG9uc2UpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IGhhbmRsZXJzLm9uUmVzcG9uc2UuYXBwbHkodGhhdCwgW3Jlc3BvbnNlLCBvcHRpb25zXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZVdpdGgodGhpcywgW3Jlc3BvbnNlXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbih0aGF0Ll9oYW5kbGVPcGVyYXRpb25TdWNjZXNzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX2hhbmRsZU9wZXJhdGlvblN1Y2Nlc3MuY2FsbCh0aGlzLCBvcGVyYXRpb25Db250ZXh0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBwcm9taXNlLmZhaWwoZnVuY3Rpb24oanF4aHIsIHRleHRTdGF0dXMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlcnJvciA9IHRoYXQuX2NyZWF0ZVJlcXVlc3RFcnJvckRhdGEob3BlcmF0aW9uQ29udGV4dCwganF4aHIsIHRleHRTdGF0dXMpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3RXaXRoKHRoaXMsIFtlcnJvcl0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24odGhhdC5faGFuZGxlT3BlcmF0aW9uRXJyb3IpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5faGFuZGxlT3BlcmF0aW9uRXJyb3IuY2FsbCh0aGlzLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihoYW5kbGVycy5vbkFmdGVyKSkge1xyXG4gICAgICAgICAgICAgICAgcHJvbWlzZS5hbHdheXMoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29udmVydCBhcmd1bWVudHMgYXJyYXkgbGlrZSB0byBhbiBhY3R1YWwgYXJyYXkgYW5kIHByZXBlbmRzIHdpdGggdGhlIG9wZXJhdGlvbiBjb250ZXh0LlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gJC5tYWtlQXJyYXkoYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgICAgICBhcmdzLnVuc2hpZnQob3BlcmF0aW9uQ29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJzLm9uQWZ0ZXIuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfZmV0Y2g6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgaWYgKHV0aWxzLmlzTnVsbChvcHRpb25zKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiXFxcIm9wdGlvbnNcXFwiIG11c3QgYmUgYSBub24gbnVsbCBvYmplY3QgbGl0ZXJhbC5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh1dGlscy5pc051bGwob3B0aW9ucy5yZXF1ZXN0KSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiXFxcIm9wdGlvbnMucmVxdWVzdFxcXCIgbXVzdCBiZSBhIG5vbiBudWxsIG9iamVjdCBsaXRlcmFsLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgb3B0aW9ucy5yZXF1ZXN0LnR5cGUgPSBvcHRpb25zLnJlcXVlc3QudHlwZSB8fCBcIkdFVFwiO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQob3B0aW9ucywge1xyXG4gICAgICAgICAgICAgICAgb25CZWZvcmU6IHRoaXMuX2JlZm9yZUZldGNoLFxyXG4gICAgICAgICAgICAgICAgb25BZnRlcjogdGhpcy5fYWZ0ZXJGZXRjaCxcclxuICAgICAgICAgICAgICAgIG9uUmVzcG9uc2U6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgcmVzcG9uc2UgcHJvcGVydGllcyB0byBvYnNlcnZhYmxlcy5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZnJvbUpTKHJlc3BvbnNlLCBvcHRpb25zLnJlc3BvbnNlLm1hcHBpbmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBfc2F2ZTogZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsKG9wdGlvbnMpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcXFwib3B0aW9uc1xcXCIgbXVzdCBiZSBhIG5vbiBudWxsIG9iamVjdCBsaXRlcmFsLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHV0aWxzLmlzTnVsbChvcHRpb25zLnJlcXVlc3QpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcXFwib3B0aW9ucy5yZXF1ZXN0XFxcIiBtdXN0IGJlIGEgbm9uIG51bGwgb2JqZWN0IGxpdGVyYWwuXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsT3JFbXB0eShvcHRpb25zLnJlcXVlc3QudHlwZSkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlxcXCJvcHRpb25zLnJlcXVlc3QudHlwZVxcXCIgbXVzdCBiZSBhIG5vbiBudWxsb3IgZW1wdHkgc3RyaW5nLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQob3B0aW9ucywge1xyXG4gICAgICAgICAgICAgICAgb25CZWZvcmU6IHRoaXMuX2JlZm9yZVNhdmUsXHJcbiAgICAgICAgICAgICAgICBvbkFmdGVyOiB0aGlzLl9hZnRlclNhdmUsXHJcbiAgICAgICAgICAgICAgICBvblJlc3BvbnNlOiBmdW5jdGlvbihyZXNwb25zZSwgcmVxdWVzdE9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodXRpbHMuaXNPYmplY3QocmVxdWVzdE9wdGlvbnMucmVxdWVzdC5kYXRhKSAmJiB1dGlscy5pc09iamVjdChyZXNwb25zZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmFjdG9yeS5tYXBwZXIoKS51cGRhdGUocmVxdWVzdE9wdGlvbnMucmVxdWVzdC5kYXRhLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIF9yZW1vdmU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgaWYgKHV0aWxzLmlzTnVsbChvcHRpb25zKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiXFxcIm9wdGlvbnNcXFwiIG11c3QgYmUgYSBub24gbnVsbCBvYmplY3QgbGl0ZXJhbC5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh1dGlscy5pc051bGwob3B0aW9ucy5yZXF1ZXN0KSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiXFxcIm9wdGlvbnMucmVxdWVzdFxcXCIgbXVzdCBiZSBhIG5vbiBudWxsIG9iamVjdCBsaXRlcmFsLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgb3B0aW9ucy5yZXF1ZXN0LnR5cGUgPSBvcHRpb25zLnJlcXVlc3QudHlwZSB8fCBcIkRFTEVURVwiO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmQob3B0aW9ucywge1xyXG4gICAgICAgICAgICAgICAgb25CZWZvcmU6IHRoaXMuX2JlZm9yZVNhdmUsXHJcbiAgICAgICAgICAgICAgICBvbkFmdGVyOiB0aGlzLl9hZnRlclNhdmVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICBhbGw6IGZ1bmN0aW9uKGNyaXRlcmlhLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciB1cmwgPSB0aGlzLl9nZXRVcmwoXCJhbGxcIik7XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVxdWVzdE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmwudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogY3JpdGVyaWFcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICByZXNwb25zZTogb3B0aW9uc1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZldGNoKCQuZXh0ZW5kKHt9LCByZXF1ZXN0T3B0aW9ucywgb3B0aW9ucykpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgZGV0YWlsOiBmdW5jdGlvbihpZCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsT3JFbXB0eShpZCkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlxcXCJpZFxcXCIgbXVzdCBiZSBhIG5vbiBudWxsIG9yIGVtcHR5IHN0cmluZy5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciB1cmwgPSB0aGlzLl9nZXRVcmwoXCJkZXRhaWxcIik7XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVxdWVzdE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmwudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogaWRcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZmV0Y2goJC5leHRlbmQocmVxdWVzdE9wdGlvbnMsIG9wdGlvbnMpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhZGQ6IGZ1bmN0aW9uKG1vZGVsLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmICh1dGlscy5pc051bGwobW9kZWwpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcXFwibW9kZWxcXFwiIG11c3QgYmUgYSBub24gbnVsbCBvYmplY3QuXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgdXJsID0gdGhpcy5fZ2V0VXJsKFwiYWRkXCIpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlcXVlc3RPcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHVybDogdXJsLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IG1vZGVsXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc2F2ZSgkLmV4dGVuZChyZXF1ZXN0T3B0aW9ucywgb3B0aW9ucykpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oLyogW2lkXSwgbW9kZWwsIFtvcHRpb25zXSAqLykge1xyXG4gICAgICAgICAgICB2YXIgaWQgPSBudWxsO1xyXG4gICAgICAgICAgICB2YXIgbW9kZWwgPSBudWxsO1xyXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IG51bGw7XHJcbiAgICAgICAgICAgIHZhciB1cmwgPSB0aGlzLl9nZXRVcmwoXCJ1cGRhdGVcIik7XHJcbiAgICAgICAgICAgIHZhciBpc1Jlc3QgPSB1cmwudHlwZSA9PT0gVXJsVHlwZS5SZXN0O1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzUmVzdCkge1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGFyZ3VtZW50c1swXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwgPSBhcmd1bWVudHNbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbMl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHV0aWxzLmlzU3RyaW5nKGFyZ3VtZW50c1swXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gYXJndW1lbnRzWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwgPSBhcmd1bWVudHNbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbCA9IGFyZ3VtZW50c1swXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwgPSBhcmd1bWVudHNbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbW9kZWwgPSBhcmd1bWVudHNbMF07XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gYXJndW1lbnRzWzFdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsKG1vZGVsKSB8fCAhdXRpbHMuaXNPYmplY3QobW9kZWwpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcXFwibW9kZWxcXFwiIG11c3QgYmUgYSBub24gbnVsbCBvYmplY3QuXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNSZXN0ICYmIHV0aWxzLmlzU3RyaW5nKGlkKSkge1xyXG4gICAgICAgICAgICAgICAgdXJsLnZhbHVlID0gdXRpbHMuc3RyaW5nRm9ybWF0KFwiezF9L3syfVwiLCB1cmwudmFsdWUsIGlkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHJlcXVlc3RPcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHVybDogdXJsLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGlzUmVzdCA/IFwiUFVUXCIgOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBtb2RlbFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NhdmUoJC5leHRlbmQocmVxdWVzdE9wdGlvbnMsIG9wdGlvbnMpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKHRhcmdldCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgdXJsID0gdGhpcy5fZ2V0VXJsKFwicmVtb3ZlXCIpO1xyXG4gICAgICAgICAgICB2YXIgaXNSZXN0ID0gdXJsLnR5cGUgPT09IFVybFR5cGUuUmVzdDtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc1Jlc3QpIHtcclxuICAgICAgICAgICAgICAgIGlmICh1dGlscy5pc1N0cmluZyh0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHV0aWxzLmlzTnVsbE9yRW1wdHkodGFyZ2V0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcXFwidGFyZ2V0XFxcIiBpZCBtdXN0IGJlIGEgbm9uIGVtcHR5IHN0cmluZy5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB1cmwudmFsdWUgPSB1dGlscy5zdHJpbmdGb3JtYXQoXCJ7MX0vezJ9XCIsIHVybC52YWx1ZSwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICghdXRpbHMuaXNPYmplY3QodGFyZ2V0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlxcXCJ0YXJnZXRcXFwiIG11c3QgYmUgYSBub24gbnVsbCBvciBlbXB0eSBzdHJpbmcgaWRlbnRpZmllciBvciBhIG5vbiBudWxsIG9iamVjdCBtb2RlbC5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0T3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3Q6IHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybC52YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBpc1Jlc3QgPyBcIkRFTEVURVwiIDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogdXRpbHMuaXNPYmplY3QodGFyZ2V0KSA/IHRhcmdldCA6IG51bGxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZW1vdmUoJC5leHRlbmQocmVxdWVzdE9wdGlvbnMsIG9wdGlvbnMpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICAgIGlmICh1dGlscy5oYXNQcm9wZXJ0eShwcm9wZXJ0eS52YWx1ZSwgbmFtZXNwYWNlKSAmJiB1dGlscy5oYXNQcm9wZXJ0eShwcm9wZXJ0eS52YWx1ZVtuYW1lc3BhY2VdLCBcInVuc3VzY3JpYmVBbGxcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eS52YWx1ZVtuYW1lc3BhY2VdLnVuc3VzY3JpYmVBbGwoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgLy8gSXRlcmF0ZSBvbiB0aGUgdmlldyBtb2RlbCBwcm9wZXJ0aWVzIHRvIGRpc3Bvc2UgYWxsIHRoZSBzdWJzY3JpcHRpb25zLlxyXG4gICAgICAgICAgICBmYWN0b3J5LnBhcnNlcigpLnBhcnNlKHRoaXMsIHtcclxuICAgICAgICAgICAgICAgIGZpbHRlcjogZmFjdG9yeS5maWx0ZXJzKCkuZ2V0RXh0ZW5kZWRQcm9wZXJ0eUZpbHRlcigpLFxyXG4gICAgICAgICAgICAgICAgb25PYmplY3Q6IGFjdGlvblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICh1dGlscy5pc0RvbUVsZW1lbnQodGhpcy5lbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ2xlYW4gdGhlIEtPIGJpbmRpbmdzIG9uIHRoZSBzcGVjaWZpZWQgRE9NIGVsZW1lbnQuXHJcbiAgICAgICAgICAgICAgICBpZiAoa28uZGF0YUZvcih0aGlzLmVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAga28uY2xlYW5Ob2RlKHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24odGhpcy5faGFuZGxlRGlzcG9zZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZURpc3Bvc2UuY2FsbCh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyoganNoaW50IC1XMDUxICovXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzO1xyXG4gICAgICAgICAgICAvKiBqc2hpbnQgK1cwNTEgKi9cclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIENyZWF0ZSBhIG5ldyBvcGVyYXRpb24gY29udGV4dCB3aXRoIHRoZSBmb2xsb3dpbmcgc3RydWN0dXJlOlxyXG4gICAgICAgIC8vICAtIHVybDogVGhlIHJlcXVlc3QgVVJMLlxyXG4gICAgICAgIC8vICAtIG1ldGhvZDogVGhlIG9wZXJhdGlvbiBtZXRob2QuXHJcbiAgICAgICAgLy8gIC0gZGF0YTogVGhlIHJlcXVlc3QgZGF0YS5cclxuICAgICAgICBfY3JlYXRlT3BlcmF0aW9uQ29udGV4dDogZnVuY3Rpb24ocmVxdWVzdCkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdXJsOiByZXF1ZXN0LnVybCxcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogdGhpcy5fZ2V0T3BlcmF0aW9uTWV0aG9kKHJlcXVlc3QudHlwZSksXHJcbiAgICAgICAgICAgICAgICBkYXRhOiByZXF1ZXN0LmRhdGFcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIF9jcmVhdGVSZXF1ZXN0RXJyb3JEYXRhOiBmdW5jdGlvbihvcGVyYXRpb25Db250ZXh0LCBqcXhociwgdGV4dFN0YXR1cykge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IG51bGw7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIXV0aWxzLmlzTnVsbChqcXhoci5yZXNwb25zZUpTT04pKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0ganF4aHIucmVzcG9uc2VKU09OO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCF1dGlscy5pc051bGwoanF4aHIucmVzcG9uc2VYTUwpKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0ganF4aHIucmVzcG9uc2VYTUw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0ganF4aHIucmVzcG9uc2VUZXh0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBvcGVyYXRpb25Db250ZXh0LnN0YXR1c0NvZGUgPSBqcXhoci5zdGF0dXM7XHJcbiAgICAgICAgICAgIG9wZXJhdGlvbkNvbnRleHQuc3RhdHVzVGV4dCA9IGpxeGhyLnN0YXR1c1RleHQ7XHJcbiAgICAgICAgICAgIG9wZXJhdGlvbkNvbnRleHQuZXhjZXB0aW9uID0gdGV4dFN0YXR1cztcclxuICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25Db250ZXh0OiBvcGVyYXRpb25Db250ZXh0XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX2dldE9wZXJhdGlvbk1ldGhvZDogZnVuY3Rpb24oaHR0cFZlcmIpIHtcclxuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IE9wZXJhdGlvbk1ldGhvZC5HZXQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoaHR0cFZlcmIgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICAgICAgICBtZXRob2QgPSBPcGVyYXRpb25NZXRob2QuUG9zdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChodHRwVmVyYiA9PT0gXCJQVVRcIikge1xyXG4gICAgICAgICAgICAgICAgbWV0aG9kID0gT3BlcmF0aW9uTWV0aG9kLlB1dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChodHRwVmVyYiA9PT0gXCJERUxFVEVcIikge1xyXG4gICAgICAgICAgICAgICAgbWV0aG9kID0gT3BlcmF0aW9uTWV0aG9kLkRlbGV0ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1ldGhvZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFxyXG4gICAgICAgIF9nZXRVcmw6IGZ1bmN0aW9uKG9wZXJhdGlvbikge1xyXG4gICAgICAgICAgICBpZiAoIXV0aWxzLmlzTnVsbE9yRW1wdHkodGhpcy5fdXJsKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gV2hlbiB0aGUgVVJMIGlzIGEgc3RyaW5nLCB3ZSBjb25zaWRlciB0aGF0IHlvdXIgZW5kcG9pbnQgZXhwb3NlIGEgUkVTVGZ1bCBBUElcclxuICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBpZiBpdCBpcyBhbiBvYmplY3QsIHdlIGNvbnNpZGVyIGl0IGV4cG9zZSBhbiBSUEMgQVBJLlxyXG4gICAgICAgICAgICAgICAgaWYgKHV0aWxzLmlzU3RyaW5nKHRoaXMuX3VybCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5fdXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBVcmxUeXBlLlJlc3RcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodXRpbHMuaXNPYmplY3QodGhpcy5fdXJsKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSB0aGlzLl91cmxbb3BlcmF0aW9uXTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiAodXRpbHMuaXNOdWxsT3JFbXB0eSh1cmwpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcih1dGlscy5zdHJpbmdGb3JtYXQoXCJUaGUgVVJMIGZvciB0aGUgb3BlcmF0aW9uIFxcXCJ7MX1cXFwiIGlzIG5vdCBzcGVjaWZpZWQuXCIsIG9wZXJhdGlvbikpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBVcmxUeXBlLlJwY1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvIHVzZSBhbnkgb2YgdGhlIEFKQVggb3BlcmF0aW9ucywgdGhlIFxcXCJfdXJsXFxcIiBwcm9wZXJ0eSBtdXN0IGJlIGEgbm9uLW51bGwvZW1wdHkgc3RyaW5nIG9yIGEgbm9uLW51bGwgb2JqZWN0IGxpdGVyYWwuXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgU2hlbGJ5LlZpZXdNb2RlbC5wcm90b3R5cGUuX2V4dGVuZGVycyA9IHtcclxuICAgICAgICBcIipcIjoge1xyXG4gICAgICAgICAgICBcInV0aWxpdHlcIjogU2hlbGJ5LkV4dGVuZGVycy51dGlsaXR5LFxyXG4gICAgICAgICAgICBcInN1YnNjcmliZVwiOiBTaGVsYnkuRXh0ZW5kZXJzLnN1YnNjcmliZSxcclxuICAgICAgICAgICAgXCJlZGl0XCI6IFNoZWxieS5FeHRlbmRlcnMuZWRpdFxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdmFyIFVybFR5cGUgPSBTaGVsYnkuVmlld01vZGVsLlVybFR5cGUgPSB7XHJcbiAgICAgICAgUmVzdDogXCJSRVNUXCIsXHJcbiAgICAgICAgUnBjOiBcIlJQQ1wiXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB2YXIgT3BlcmF0aW9uTWV0aG9kID0gU2hlbGJ5LlZpZXdNb2RlbC5PcGVyYXRpb25NZXRob2QgPSB7XHJcbiAgICAgICAgR2V0OiBcIkdFVFwiLFxyXG4gICAgICAgIFBvc3Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIFB1dDogXCJQVVRcIixcclxuICAgICAgICBEZWxldGU6IFwiREVMRVRFXCJcclxuICAgIH07XHJcbiAgICBcclxuICAgIFNoZWxieS5WaWV3TW9kZWwuZXh0ZW5kID0gZXh0ZW5kO1xyXG59KShTaGVsYnkubmFtZXNwYWNlLCBcclxuICAgU2hlbGJ5LmV4dGVuZCwgXHJcbiAgIFNoZWxieS51dGlscywgXHJcbiAgIFNoZWxieS5GYWN0b3J5Lmluc3RhbmNlKTtcclxuXHJcblxyXG5cclxucmV0dXJuIFNoZWxieTtcclxuXHJcbn0pO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24oKSB7XHJcbiAgICAvLyB2YXIgdGVzdCA9IHJlcXVpcmUoXCJrbm9ja291dFwiKTtcclxuXHJcbiAgICAvLyB0ZXN0KCk7XHJcblxyXG4gICAgdmFyIGtub2Nrb3V0ID0gcmVxdWlyZShcImtub2Nrb3V0XCIpO1xyXG4gICAgdmFyIHNoZWxieSA9IHJlcXVpcmUoXCIuLi8uLi9idWlsZC9zaGVsYnkuanNcIik7XHJcblxyXG4gICAgdmFyIFZpZXdNb2RlbCA9IHNoZWxieS5WaWV3TW9kZWwuZXh0ZW5kKHtcclxuICAgICAgICBtZXNzYWdlOiBrbm9ja291dC5vYnNlcnZhYmxlKFwiQm9vdHN0cmFwcGluZyBTaGVsYnkgd2l0aCBicm93c2VyaWZ5IHdvcmtzIVwiKVxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IFZpZXdNb2RlbCgpLmJpbmQoKTtcclxufSkoKTsiXX0=
