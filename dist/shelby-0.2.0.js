/*
 * Shelby JavaScript library v0.2.0
 * (c) Patrick Lafrance - https://github.com/patricklafrance/shelby
 * License: MIT (http://www.opensource.org/licenses/mit-license.php) 
 */

(function(factory) {
    "use strict";
    
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        var instance = factory(require("jquery"), require("knockout"), require("knockout.viewmodel"));

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
            "knockout",
            "knockout.viewmodel"
        ], factory);
    } 
    else {
        var target = window || global;

        // Expose as a global object.
        target.Shelby = factory(target.jQuery, target.ko, target.ko.viewmodel);
    }
})(function($, ko, koViewModel) {
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

// Shelby.utils
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

        stringStartsWith: function(str, value) {
            return str.indexOf(value) === 0;
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
    // Function use by the Shelby components to let you extend them.
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

// Shelby.Components
// ---------------------------------

(function(extend, utils) {
    Shelby.Components = {};

    // ---------------------------------

    var ComponentsFactory = Shelby.ComponentsFactory = function() {
        this._components = {};
        this._instances = {};
    };

    Shelby.ComponentsFactory.prototype = {
        registerComponent: function(name, factory) {
            var that = this;

            if (utils.isNullOrEmpty(name)) {
                throw new Error("\"name\" must be a non-null or empty component name.");
            }

            if (!$.isFunction(factory)) {
                throw new Error("\"factory\" must be a function to create instances of the component.");
            }

            this._components[name] = function(args) {
                var instance = that._instances[name];

                if (utils.isUndefined(instance)) {
                    instance = that._instances[name] = factory(args);
                }

                return instance;
            };
        },

        registerTransientComponent: function(name, factory) {
            if (utils.isNullOrEmpty(name)) {
                throw new Error("\"name\" must be a non-null or empty component name.");
            }

            if (!$.isFunction(factory)) {
                throw new Error("\"factory\" must be a function to create instances of the component.");
            }

            this._components[name] = factory;
        },

        getComponent: function(name, args) {
            var factory = this._components[name];

            if (!$.isFunction(factory)) {
                throw new Error(utils.stringFormat("Cannot find a component factory for {1}", name));
            }

            return factory(args);
        }
    };

    ComponentsFactory.extend = extend;

    // ---------------------------------

    $.extend(true, Shelby, {
        _componentsFactory: null,

        setComponentFactory: function(factory) {
            if (utils.isNull(factory)) {
                throw new Error("\"factory\" must be an object.");
            }

            this._componentsFactory = factory;
        },

        registerComponent: function(name, factory) {
            var that = this;

            this._componentsFactory.registerComponent(name, factory);

            // Define a shortcut function to access the component.
            Shelby.Components[name] = function(args) {
                return that._componentsFactory.getComponent(name, args);
            };
        },

        registerTransientComponent: function(name, factory) {
            var that = this;

            this._componentsFactory.registerTransientComponent(name, factory);

            // Define a shortcut function to access the component.
            Shelby.Components[name] = function(args) {
                return that._componentsFactory.getComponent(name, args);
            };          
        }
    });

    // Register a default factory.
    Shelby.setComponentFactory(new ComponentsFactory()); 
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
            this._next("{root}", obj, "", null);
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
                    proceed = this._next("[i]", unwrappedArray[i], path, array);
                    
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
            if (newPart === "{root}") {
                return newPart;
            }

            if (newPart === "[i]") {
                return actualPath + newPart;
            }
            
            return utils.stringFormat("{1}.{2}", actualPath, newPart);
        }
    };
    
    Shelby.Parser.extend = extend;

    // Register the components.
    Shelby.registerComponent("parser", function() {
        return new Shelby.Parser();
    });
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
                if (utils.stringStartsWith(path, "{root}")) {
                    // If this is a path matching array items, create a function that use a regular expression to match the current paths representing array items properties,
                    // otherwise create a function that use the equality operator to match the current paths against the path.
                    if (utils.stringEndsWith(path, "[i]")) {
                        // Transform "[i]" into regex expression [^]+ (means that everything is accepted).
                        var pattern = null;

                        try {
                            pattern = new RegExp(path.replace(/\[i\]/g, "[^]+"));
                        }
                        catch (e) {
                            // IE8 cause a RegExpError exception when the ']' character is not escaped.
                            pattern = new RegExp(path.replace(/\[i\]/g, "[^]]+"));
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
                }
                else {
                    return function(current) {
                        if (utils.stringContains(current, path)) {
                            if (that._isArrayPath(path, current)) {
                                return that._createImperfectMatchEvaluationResult();
                            }

                            return that._createPerfectMatchEvaluationResult();
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
            return path.indexOf(current + "[i]") !== -1;
        }
    };

    Shelby.Filters.extend = extend;

    // Register the components.
    Shelby.registerComponent("filters", function() {
        return new Shelby.Filters();
    });
})(Shelby.namespace,
   Shelby.extend,
   Shelby.utils);

// Shelby.ExtenderRegistry
// ---------------------------------

(function(extend, utils) {
    Shelby.ExtenderRegistry = function() {
        this._extenders = {};
    };

    Shelby.ExtenderRegistry.prototype = {
        add: function(name, extender, path) {
            if (utils.isNullOrEmpty(name)) {
                throw new Error("\"name\" must be a non null or empty string.");
            }

            if (!$.isFunction(extender)) {
                throw new Error("\"extender\" must be a function that extend a property.");
            }

            if (utils.isNullOrEmpty(path)) {
                path = "*";
            }

            this._addExtender(path, name, extender);
        },

        _addExtender: function(path, name, extender) {
            if (utils.isNull(this._extenders[path])) {
                this._extenders[path] = {};
            }

            if (utils.isNull(this._extenders[path][name])) {
                this._extenders[path][name] = {};
            }

            this._extenders[path][name] = extender;
        },

        remove: function(name, path) {
            if (utils.isNullOrEmpty(name)) {
                throw new Error("\"name\" must be a non null or empty string.");
            }

            if (utils.isNullOrEmpty(path)) {
                path = "*";
            }

            if (!utils.isNull(this._extenders[path])) {
                if (!utils.isNull(this._extenders[path][name])) {
                    delete this._extenders[path][name];
                }

                if (utils.objectSize(this._extenders[path]) === 0) {
                    delete this._extenders[path];
                }
            }
        },

        getExtenders: function() {
            return this._extenders;
        }
    };

    Shelby.ExtenderRegistry.extend = extend;

    // Register the components.
    Shelby.registerComponent("extenderRegistry", function() {
        return new Shelby.ExtenderRegistry();
    });

    // ---------------------------------

    Shelby.registerExtender = function(name, extender, path) {
        Shelby.Components.extenderRegistry().add(name, extender, path);
    };

    Shelby.removeExtender = function(name, path) {
        Shelby.Components.extenderRegistry().remove(name, path);
    };
})(Shelby.extend,
   Shelby.utils);

// Shelby.Extenders
// ---------------------------------

(function(namespace, extend, utils) {
    Shelby.Extenders = {};

    // ---------------------------------

    var PropertyType = Shelby.PropertyType = {
        Object: 0,
        Array: 1,
        Scalar: 2
    };
    
    // ---------------------------------
    
    Shelby.ObjectExtenderBase = function(target) {
        if (utils.isNull(this._target)) {
            this._target = function() {
                return target;
            };
        }
    };

    Shelby.ObjectExtenderBase.extend = extend;

    // ---------------------------------

    Shelby.PropertyExtender = function() {
    };
    
    Shelby.PropertyExtender.prototype = {
        addExtenders: function(target, extenders) {
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
                Shelby.Components.parser().parse(target, {
                    filter: Shelby.Components.filters().getExtendablePropertyFilter(),
                    onObject: action(PropertyType.Object),
                    onArray: action(PropertyType.Array),
                    onFunction: action(PropertyType.Scalar)
                });
            }
        },
        
        removeExtenders: function(target) {
            if (utils.isNull(target)) {
                throw new Error("\"target\" must be an object.");
            }
        
            var action = function(property) {
                delete property.value[namespace];
            };
        
            // Iterate on the target properties to remove shelby extenders.
            Shelby.Components.parser().parse(target, {
                filter: Shelby.Components.filters().getExtendedPropertyFilter(),
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

    // Register the components.
    Shelby.registerComponent("propertyExtender", function() {
        return new Shelby.PropertyExtender();
    });
})(Shelby.namespace,
   Shelby.extend,
   Shelby.utils);

// Shelby.SubscribeExtender
// ---------------------------------

(function(namespace, extend, utils) {
    var PropertyType = Shelby.PropertyType;

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

    Shelby.SubscribeObjectExtender = Shelby.ObjectExtenderBase.extend({
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

            var propertyFilter = Shelby.Components.filters().getPathFilter(options.include, options.exclude);
            
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
                    var path = utils.isNullOrEmpty(context.path) ? property.path : utils.stringFormat("{1}{2}", context.path, property.path.replace("{root}", ""));
                    var parent = utils.isNull(context.parent) ? property.parent : context.parent;
                    var evaluationResult = propertyEvaluator(path);

                    // Even if this is not a perfect match, there is cases (like arrays) when we want to add a subscription
                    // to the property to handle special behaviors (like item's automatic subscriptions for arrays).
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
                                            path: path + "[i]",
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
            Shelby.Components.parser().parse(target, {
                filter: Shelby.Components.filters().getExtendedPropertyFilter(),
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
            Shelby.Components.parser().parse(target, {
                filter: Shelby.Components.filters().getExtendedPropertyFilter(),
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

    Shelby.SubscribeObjectExtender._observableExtenders = {
        "*": {
            shelbySubscribe: true
        },
        "array": {
            shelbyArraySubscribe: true
        }
    };

    Shelby.SubscribeObjectExtender.extend = extend;

    // Register the components.
    Shelby.registerTransientComponent("subscribeObjectExtender", function(target) {
        return new Shelby.SubscribeObjectExtender(target);
    });

    // ---------------------------------

    Shelby.Extenders.subscribeExtender = function(target, type) {
        // Apply the observable extenders to everything that is an observable.
        if (type !== PropertyType.Object) {
            target.extend(Shelby.SubscribeObjectExtender._observableExtenders["*"]);
            
            if (type === PropertyType.Array) {
                var arrayExtenders = Shelby.SubscribeObjectExtender._observableExtenders["array"];

                if (!utils.isNull(arrayExtenders)) {
                    target.extend(arrayExtenders);
                }
            }
            
            target[namespace]._subscriptions = {};
        }
        
        if (type === PropertyType.Object) {
            var objectExtender = Shelby.Components.subscribeObjectExtender(target);

            var facade = {
                subscribe: function(callback, options) {
                    return objectExtender.subscribe(callback, options);
                },

                unsuscribeAll: function() {
                    objectExtender.unsuscribeAll();
                },

                mute: function() {
                    objectExtender.mute();
                },

                unmute: function() {
                    objectExtender.unmute();
                }
            };

            if (Shelby.test === true) {
                facade._subscribeExtender = objectExtender;
            }

            // Copy all the functions and properties to the target.
            $.extend(target[namespace], facade);
        }
    };

    Shelby.registerExtender("subscribe", Shelby.Extenders.subscribeExtender, "*");
})(Shelby.namespace, 
   Shelby.extend,
   Shelby.utils);

// Shelby.EditExtender
// ---------------------------------

(function(namespace, extend, utils) {
    var PropertyType = Shelby.PropertyType;

    ko.extenders.shelbyEdit = function(target) {
        if (!$.isFunction(target[namespace].pause) || !$.isFunction(target[namespace].resume)) {
            throw new Error(utils.stringFormat("\"shelbyEditable\" can only extends an observable having \"{1}.pause\" and \"{1}.resume\" functions.", namespace));
        }

        var wasPause = false;
    
        $.extend(target[namespace], {
            current: target.peek(),
            
            hasMutated: ko.observable(false),
            isEditing: ko.observable(false),
            deferNotifications: false,
            
            beginEdit: function(deferNotifications) {
                if (!this.isEditing.peek()) {
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
                    this.isEditing(true);
                }
            },
            
            endEdit: function(canNotify) {
                var that = this;

                if (this.isEditing.peek() && this.hasMutated.peek()) {
                    this.current = target.peek();
                }
                
                if (this.isEditing.peek()) {
                    if (!wasPause && this.deferNotifications !== false) {
                        var hasMutated = that.hasMutated.peek();

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
                           
                this.hasMutated(false);     
                this.isEditing(false);
            },

            resetEdit: function() {
                if (this.isEditing.peek() && this.hasMutated.peek()) {
                    target(this.current);
                }
            },
            
            cancelEdit: function() {
                target[namespace].resetEdit();

                if (this.isEditing.peek()) {
                    if (!wasPause && this.deferNotifications !== false) {
                        // Defer the "resume" to prevent synchronization problem with the UI.
                        setTimeout(function() {
                            target[namespace].resume();
                        }, 10);
                    }
                }
                
                this.isEditing(false);
                this.hasMutated(false);
            }
        });
        
        target.subscribe(function(value) {
            if (!utils.isNull(target[namespace]) && target[namespace].isEditing.peek() && !target[namespace].hasMutated.peek()) {
                if ($.isArray(value)) {
                    target[namespace].hasMutated(ko.utils.compareArrays(target[namespace].current, value).length === 0);
                }
                else {
                    target[namespace].hasMutated(value !== target[namespace].current);
                }
            }
        });
        
        return target;
    };

    // ---------------------------------

    Shelby.EditObjectExtender = Shelby.ObjectExtenderBase.extend({
        _initialize: function() {
            this.isEditing = ko.observable(false);
        
            // Options for the current edition. 
            // The object structure is:
            //  - include: An array of property paths that will compose the edition.
            //  - exclude: An array of property paths that will be exclude from the edition.
            this._editOptions = null;
        },

        beginEdit: function(options) {
            if (!this.isEditing.peek()) {
                this._editOptions = options || {};
            
                this._executeEditAction(function(property) {
                    property.value[namespace].beginEdit(this._editOptions.deferNotifications);
                });
                
                this.isEditing(true);
            }
        },

        endEdit: function(notifyOnce) {
            if (this.isEditing.peek()) {
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
                    if (property.value[namespace].isEditing.peek() === true) {
                        if (property.value[namespace].hasMutated.peek() === true) {
                            context.count += 1;
                        }

                        property.value[namespace].endEdit(canNotify(context));
                    }
                };
            
                this._executeEditAction(action, {
                    count: 0
                });
                
                this.isEditing(false);
            }
        },
        
        resetEdit: function() {
            if (this.isEditing.peek()) {
                this._executeEditAction(function(property) {
                    if (property.value[namespace].isEditing.peek() === true) {
                        property.value[namespace].resetEdit();
                    }
                });
            }
        },
        
        cancelEdit: function() {
            if (this.isEditing) {
                this._executeEditAction(function(property) {
                    if (property.value[namespace].isEditing.peek() === true) {
                        property.value[namespace].cancelEdit();
                    }
                });
                
                this.isEditing(false);
            }
        },
        
        hasMutated: function() {
            var ret = false;
        
            if (this.isEditing.peek()) {
                this._executeEditAction(function(property) {
                    if (property.value[namespace].hasMutated.peek() === true) {
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
            var propertyEvaluator = Shelby.Components.filters().getPathFilter(this._editOptions.include, this._editOptions.exclude);
        
            var execute = function(property) {
                if (propertyEvaluator(property.path).isPerfectMatch) {
                    return action.apply(that, [property, context]);
                }
            };
        
            // Iterate on the target properties to execute the action on all the observables matching criterias.
            Shelby.Components.parser().parse(this._target(), {
                filter: Shelby.Components.filters().getExtendedPropertyFilter(),
                onArray: execute,
                onFunction: execute
            });
        }        
    });

    Shelby.EditObjectExtender._observableExtenders = {
        shelbyEdit: true
    };

    Shelby.EditObjectExtender.extend = extend;

    // Register the components.
    Shelby.registerTransientComponent("editObjectExtender", function(target) {
        return new Shelby.EditObjectExtender(target);
    });

    // ---------------------------------

    Shelby.Extenders.editExtender = function(target, type) {
        if (type !== PropertyType.Object) {
            target.extend(Shelby.EditObjectExtender._observableExtenders);
        }
        
        if (type === PropertyType.Object) {
            var objectExtender = Shelby.Components.editObjectExtender(target);

            var facade = {
                isEditing: ko.pureComputed({
                    read: function() {
                        return objectExtender.isEditing();
                    },
                    deferEvaluation: true
                }),

                beginEdit: function(options) {
                    objectExtender.beginEdit(options);
                },

                endEdit: function(notifyOnce) {
                    objectExtender.endEdit(notifyOnce);
                },

                resetEdit: function() {
                    objectExtender.resetEdit();
                },

                cancelEdit: function() {
                    objectExtender.cancelEdit();
                },

                hasMutated: function() {
                    return objectExtender.hasMutated();
                }
            };

            if (Shelby.test === true) {
                facade._editExtender = objectExtender;
            }

            // Copy all the facade functions and properties to the target.
            $.extend(target[namespace], facade);
        }
    };

    Shelby.registerExtender("edit", Shelby.Extenders.editExtender, "*");
})(Shelby.namespace,
   Shelby.extend,
   Shelby.utils);

// Shelby.UtilityExtender
// ---------------------------------

(function(namespace, extend, utils) {
    var PropertyType = Shelby.PropertyType;

    Shelby.UtilityObjectExtender = Shelby.ObjectExtenderBase.extend({
        reset: function(/* resetValue, options */) {
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
            Shelby.Components.parser().parse(this._target(), {
                filter: Shelby.Components.filters().getExtendedPropertyFilter(),
                onFunction: action
            });
        },
        
        updateFrom: function(obj) {
            if (!utils.isObject(obj)) {
                throw new Error("\"obj\" must be an object.");
            }

            try {
                Shelby.Components.mapper().update(this._target(), obj);
            }
            catch (e) {
                throw new Error("An error occurred while updating the target object. Make sure that all the observables properties of the target object has been created by the Shelby mapper.");
            }
        }        
    });

    Shelby.UtilityObjectExtender.extend = extend;

    // Register the components.
    Shelby.registerTransientComponent("utilityObjectExtender", function(target) {
        return new Shelby.UtilityObjectExtender(target);
    });

    // ---------------------------------

    Shelby.Extenders.utilityExtender = function(target, type) {
        if (type !== PropertyType.Scalar) {
            var objectExtender = Shelby.Components.utilityObjectExtender(target);

            var facade = {
                reset: function() {
                    objectExtender.reset.apply(objectExtender, arguments);
                },

                updateFrom: function(obj) {
                    objectExtender.updateFrom(obj);
                }
            };

            // Copy all the functions and properties to the target.
            $.extend(target[namespace], facade);
        }
    };

    Shelby.registerExtender("utility", Shelby.Extenders.utilityExtender, "*");
})(Shelby.namespace, 
   Shelby.extend,
   Shelby.utils);

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
    Shelby.registerComponent("ajax", function() {
        return new Ajax();
    });
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
            return koViewModel.fromModel.apply(koViewModel, arguments);
        },
        
        toJS: function() {
            return koViewModel.toModel.apply(koViewModel, arguments);
        },
        
        update: function() {
            return koViewModel.updateFromModel.apply(koViewModel, arguments);
        }
    };
    
    Shelby.Mapper.extend = extend;

    // Register the components.
    Shelby.registerComponent("mapper", function() {
        return new Shelby.Mapper();
    });
})(Shelby.extend);

Shelby._ViewModel = {};

// Shelby._ViewModel.Bindable
// ---------------------------------

(function(utils) {
    Shelby._ViewModel.Bindable = {
        _beforeBind: null,
        _afterBind: null,

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

        _disposeBindings: function() {
            if (utils.isDomElement(this.element)) {
                // Clean the KO bindings on the specified DOM element.
                if (ko.dataFor(this.element)) {
                    ko.cleanNode(this.element);
                }
            }
        }
    };
})(Shelby.utils);

// Shelby._ViewModel.Disposable
// ---------------------------------

(function() {
    Shelby._ViewModel.Disposable = {
        _handleDispose: null
    };
})();

// Shelby._ViewModel.Extendable
// ---------------------------------

(function(namespace, utils) {
    Shelby._ViewModel.Extendable = {
        _fromJS: function(obj, mappingOptions, extenders) {
            // Convert properties to observables.
            var mapped = Shelby.Components.mapper().fromJS(obj, mappingOptions);
            
            // Extend all the object properties.
            this._applyExtendersToObject(mapped, extenders);
            
            return mapped;
        },
        
        _toJS: function(obj) {
            // Convert observables back to primitive values.
            var unmapped = Shelby.Components.mapper().toJS(obj);
            
            // Remove all the extenders left on the object properties (ex. on objects).
            this._removeExtendersFromObject(unmapped);
            
            return unmapped;
        },

        _applyExtendersToObject: function(obj, extenders) {
            if (utils.isNull(extenders)) {
                extenders = Shelby.Components.extenderRegistry().getExtenders();
            }

            if (utils.objectSize(extenders) > 0) {
                Shelby.Components.propertyExtender().addExtenders(obj, extenders);
            }
        },
        
        _removeExtendersFromObject: function(obj) {
            Shelby.Components.propertyExtender().removeExtenders(obj);
        },

        _disposeAllSubscriptions: function() {
            var action = function(property) {
                if (utils.hasProperty(property.value, namespace) && utils.hasProperty(property.value[namespace], "unsuscribeAll")) {
                    property.value[namespace].unsuscribeAll();
                }
            };
        
            // Iterate on the view model properties to dispose all the subscriptions.
            Shelby.Components.parser().parse(this, {
                filter: Shelby.Components.filters().getExtendedPropertyFilter(),
                onObject: action
            });
        }
    };
})(Shelby.namespace,
   Shelby.utils);

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

// Shelby._ViewModel.Http
// ---------------------------------

(function(extend, utils) {
    var HttpEvent = Shelby.HttpEvent;
    var OperationContext = Shelby.OperationContext;
    var RequestError = Shelby.RequestError;

    Shelby._ViewModel.Http = {
        _url: null,

        _send: function(options, handlers) {
            if (utils.isNullOrEmpty(options.request.url)) {
                throw new Error("\"options.request.url\" must be a non null or empty string.");
            }
        
            var that = this;

            var request = $.extend({ context: this }, options.request);
            var operationContext = new OperationContext(request);

            if ($.isFunction(handlers.onBefore)) {
                request.beforeSend = function() {
                    // Prepend original arguments with the operation context.
                    var args = $.makeArray(arguments);
                    args.unshift(operationContext);
                    
                    // The original jQuery AJAX "beforeSend" function support returning "false" to abort the
                    // request, allow a return value to support that behaviour.
                    return handlers.onBefore.apply(that, args);
                };
            }

            // Convert the request data from observables to plain objects.
            if (utils.isObject(request.data)) {
                request.data = this._toJS(request.data);
            }

            // Execute the AJAX request.
            var promise = Shelby.Components.ajax().send(request);

            // Using a "proxy" deferred to add custom mapping / error handling logics through 
            // the AJAX promise handlers.
            var deferred = $.Deferred();

            promise.done(function(response) {
                if (!utils.isNull(response)) {
                    options.response = options.response || {};

                    // If the caller did NOT specify to NOT process the response, process the response. 
                    if (options.response.process !== false) {
                        if ($.isFunction(options.response.extractor)) {
                            response = options.response.extractor.call(that, response);
                        }

                        if ($.isFunction(handlers.onResponse)) {
                            response = handlers.onResponse.apply(that, [response, options]);
                        }
                    }
                }
            
                deferred.resolveWith(this, [response]);

                if ($.isFunction(that._notify)) {
                    that._notify.call(that, HttpEvent.OperationSuccess, [operationContext]);
                }
            });

            promise.fail(function(jqxhr, textStatus) {
                var error = [new RequestError(operationContext, jqxhr, textStatus)];
                
                deferred.rejectWith(this, error);

                if ($.isFunction(that._notify)) {
                    that._notify.call(that, HttpEvent.OperationError, error);
                }
            });

            if ($.isFunction(handlers.onAfter)) {
                promise.always(function() {
                    // Convert arguments array like to an actual array and prepends with the operation context.
                    var args = $.makeArray(arguments);
                    args.unshift(operationContext);

                    handlers.onAfter.apply(that, args);
                });
            }
            
            return deferred.promise();
        },

        _fetch: function(options) {
            var that = this;

            if (utils.isNull(options)) {
                throw new Error("\"options\" must be a non null object literal.");
            }

            if (utils.isNull(options.request)) {
                throw new Error("\"options.request\" must be a non null object literal.");
            }

            options.request.type = options.request.type || "GET";

            return this._send(options, {
                onBefore: function() {
                    if ($.isFunction(this._notify)) {
                        that._notify.call(that, HttpEvent.BeforeFetch, arguments);
                    }
                },
                onAfter: function() {
                    if ($.isFunction(this._notify)) {
                        that._notify.call(that, HttpEvent.AfterFetch, arguments);
                    }
                },
                onResponse: function(response) {
                    // Convert the response properties to observables.
                    return this._fromJS(response, options.response.mapping, options.response.extenders);
                }
            });
        },

        _save: function(options) {
            var that = this;

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
                onBefore: function() {
                    if ($.isFunction(that._notify)) {
                        that._notify.call(that, HttpEvent.BeforeSave, arguments);
                    }
                },
                onAfter: function() {
                    if ($.isFunction(that._notify)) {
                        that._notify.call(that, HttpEvent.AfterSave, arguments);
                    }
                },
                onResponse: function(response, requestOptions) {
                    if (utils.isObject(requestOptions.request.data) && utils.isObject(response)) {
                        Shelby.Components.mapper().update(requestOptions.request.data, response);
                    }

                    return response;
                }
            });
        },

        _remove: function(options) {
            var that = this;

            if (utils.isNull(options)) {
                throw new Error("\"options\" must be a non null object literal.");
            }

            if (utils.isNull(options.request)) {
                throw new Error("\"options.request\" must be a non null object literal.");
            }

            options.request.type = options.request.type || "DELETE";

            return this._send(options, {
                onBefore: function() {
                    if ($.isFunction(that._notify)) {
                        that._notify.call(that, HttpEvent.BeforeRemove, arguments);
                    }
                },
                onAfter: function() {
                    if ($.isFunction(that._notify)) {
                        that._notify.call(that, HttpEvent.AfterRemove, arguments);
                    }
                }
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

// Shelby.EventManager
// ---------------------------------

(function(extend, utils) {
    Shelby.EventManager = function() {
        this._eventHandlers = {};
    };

    Shelby.EventManager.prototype = {
        notifyHandlers: function(eventName, args, context) {
            if (utils.isNullOrEmpty(eventName)) {
                throw new Error("\"eventName\" must be a non null or empty string.");
            }

            var handlers = this._eventHandlers[eventName];

            if ($.isArray(handlers))  {
                for (var i = 0, max = handlers.length; i < max; i += 1) {
                    handlers[i].callback.apply(context, args);
                }
            }
        },

        registerEventHandler: function(eventName, callback) {
            if (utils.isNullOrEmpty(eventName)) {
                throw new Error("\"eventName\" must be a non null or empty string.");
            }

            if (!$.isFunction(callback)) {
                throw new Error("\"callback\" must be a function.");
            }

            if (utils.stringContains(eventName, ".")) {
                var descriptor = this._parseEventName(eventName);

                this._addEventHandler(descriptor.event, descriptor.name, callback);
            }
            else {
                this._addEventHandler(eventName, null, callback);
            }
        },

        _addEventHandler: function(event, name, callback) {
            if (!$.isArray(this._eventHandlers[event])) {
                this._eventHandlers[event] = [];
            }

            this._eventHandlers[event].push({
                name: name,
                callback: callback
            });
        },

        removeEventHandler: function(eventName) {
            if (utils.isNullOrEmpty(eventName) || !utils.stringContains(eventName, ".")) {
                throw new Error("\"eventName\" must be a non null or empty string and be a named event (ex. foo.beforeFetch).");
            }

            var descriptor = this._parseEventName(eventName);
            var handlers = this._eventHandlers[descriptor.event];

            if ($.isArray(handlers)) {
                utils.arrayRemoveValue(handlers, descriptor.name, function(item) {
                    return item.name === descriptor.name;
                });
            }
        },

        _parseEventName: function(eventName) {
            var dotIndex = eventName.indexOf(".");

            return {
                name: eventName.substring(dotIndex + 1),
                event: eventName.substring(0, dotIndex)
            };
        }
    };

    Shelby.EventManager.extend = extend;

    // Register the components.
    Shelby.registerComponent("eventManager", function() {
        return new Shelby.EventManager();
    });

    // ---------------------------------

    Shelby.registerEventHandler = function(eventName, callback) {
        Shelby.Components.eventManager().registerEventHandler(eventName, callback);
    };

    Shelby.removeEventHandler = function(eventName) {
        Shelby.Components.eventManager().removeEventHandler(eventName);
    };
})(Shelby.extend,
   Shelby.utils);

// Shelby.ViewModel
// ---------------------------------

(function(extend, Bindable, Disposable, Extendable, Http, HttpEvent) {
    Shelby.ViewModel = function() {
        // This is used by the binding functions.
        this.element = null;
    };

    var prototype = $.extend(true, {}, 
        Bindable,
        Disposable,
        Extendable,
        Http,
        HttpEvent, {
            _initialize: null,

            dispose: function() {
                this._disposeAllSubscriptions();
                this._disposeBindings();

                if ($.isFunction(this._handleDispose)) {
                    this._handleDispose.call(this);
                }

                /* jshint -W051 */
                delete this;
                /* jshint +W051 */
            }
        });
    
    Shelby.ViewModel.prototype = prototype;
    Shelby.ViewModel.extend = extend;
})(Shelby.extend,
   Shelby._ViewModel.Bindable,
   Shelby._ViewModel.Disposable,
   Shelby._ViewModel.Extendable,
   Shelby._ViewModel.Http,
   Shelby._ViewModel.HttpEvent);



// Shelby.ComponentViewModel
// ---------------------------------

(function(extend, Disposable, Extendable, Http) {
    Shelby.ComponentViewModel = function() {
    };

    var prototype = $.extend(true, {},
        Disposable,
        Extendable,
        Http, {
            _initialize: null,

            dispose: function() {
                this._disposeAllSubscriptions();

                if ($.isFunction(this._handleDispose)) {
                    this._handleDispose.call(this);
                }

                /* jshint -W051 */
                delete this;
                /* jshint +W051 */
            }
        });

    Shelby.ComponentViewModel.prototype = prototype;
    Shelby.ComponentViewModel.extend = extend;
})(Shelby.extend,
   Shelby._ViewModel.Disposable,
   Shelby._ViewModel.Extendable,
   Shelby._ViewModel.Http);

return Shelby;

});