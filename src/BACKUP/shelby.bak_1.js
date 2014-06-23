(function(factory) {
    "use strict";
	
	if (typeof module === "object" && typeof module.exports === "object") {
		// Register as a CommonJS module.
		module.exports = factory(window.jQuery, window.ko);
	}
    else if (typeof define === "function" && define.amd) {
        // Register as a named AMD module.
        define("shelby", [
            "jquery",
			"knockout"
        ], factory);
    } 
	else {
        // Expose as a global object.
        window.Shelby = factory(window.jQuery, window.ko);
    }
}(function($, ko, undefined) {
	"use strict";
	
	var Shelby = {};
	
	// Current version.
	Shelby.VERSION = "0.1.0";
	
	// When true, additional informations will be output to the console.
	Shelby.debug = false;
	
	// Private properties
	// ---------------------------------
	
	var currentGuid = 0;
	
	// Utils
	// ---------------------------------
	
	var objectHasOwnPropertySupported = $.isFunction(Object.hasOwnProperty),
		objectKeysSupported = $.isFunction(Object.keys),
		arrayIndexOfSupported = $.isFunction(Array.prototype.indexOf),
		arrayMapSupported = $.isFunction(Array.prototype.map);
	
	var utils = Shelby.Utils = {
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
		
		isjQueryObject: function(value) {
			return value instanceof jQuery;
		},
		
		// Custom hasOwnProperty function providing a fallback if the original function
		// is not available for the current browser.
		hasOwnProperty: function(obj, propertyKey) {
			if (!objectHasOwnPropertySupported) {
				return propertyKey in obj;
			}
			
			return obj.hasOwnProperty(propertyKey);
		},
		
		hasProperty: function(obj, propertyKey) {
			return propertyKey in obj;
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
					}
				}
			
				for (var i = 0, max = array.length; i < max; i += 1) {
					if (comparer.apply(context, [array[i], value])) {
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
		
		arrayMap: function(array, mapper, context) {
			if (!arrayMapSupported) {
				var mappedArray = [];
			
				for (var i = 0, max = array.length; i < max; i += 1) {
					mappedArray.push(mapper.apply(context, [array[i], i, array]));
				}
				
				return mappedArray;
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
			
			for (var propertyKey in obj) {
				if (this.hasOwnProperty(obj, propertyKey)) {
					mappedObject[propertyKey] = mapper.apply(context, [obj[propertyKey], propertyKey, obj]);
				}
			}
			
			return mappedObject;
		},
		
		objectKeys: function(obj) {
			if (!objectKeysSupported) {
				var propertyKeys = [];
			
				for (var propertyKey in obj) {
					if (this.hasOwnProperty(obj, propertyKey)) {
						propertyKeys.push(propertyKey);
					}
				}
				
				return propertyKeys;
			}
			
			return Object.keys(obj)
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
		
		// Tokens start at index 1. Ex. {1}, {2}...
		stringFormat: function() {
			var args = arguments,
				str = args[0];

			return str.replace(/\{(\d+)\}/g, function(m, n) {
				return args[n];
			});
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
	
	// Shared functions
	// ---------------------------------
	
	// Function use by some of the Shelby object to let you extend them with
	// additional instance properties.
	function extend(/* objects */) {
		if (arguments.length === 0) throw new Error("At least 1 non-null plain object is require to extend a Shelby object.");
		
		var objects = [],
			parent = this;
		
		// Keep the original object constructor.
		var child = function() { 
			parent.apply(this, arguments);
			
			if ($.isFunction(this._initialize)) {
				this._initialize.apply(this, arguments);
			}
		};
		
		// Find all the objects that will extend the parent object.
		$.each(arguments, function(index, obj) {
			if (!utils.isObject(obj)) throw new Error("Only non-null literal or prototyped object can extend a Shelby object.");
			
			objects.push(utils.isNull(obj.prototype) ? obj : obj.prototype);
		});
		
		// Mixin the objets properties.
		child.prototype = $.extend.apply($, [true, {}, parent.prototype].concat(objects));
		
		// Convenience property to access the parent prototype.
		child.prototype._super = parent.prototype;
		
		// Static function to allow multiple extends.
		child.extend = extend;
		
		return child;
	}
	
	// Shelby.ObjectParser
	// ---------------------------------
	
	var objectParser = Shelby.ObjectParser = {
		_current: null,
		_options: null,
		_context: null,
	
		process: function(obj, options, context) {
			this._reset(obj, options, context);
			this._next("", obj, "");
		},
		
		_reset: function(obj, options, context) {
			this._current = obj;
			this._options = this._computeOptions(options);
			this._context = context;
		},
		
		_computeOptions: function(options) {
			if (!utils.isObject(options)) {
				options = {};
			}
			else {
				options = utils.clonePlainObject(options);
			}
			
			// To speed up things, if no filter are specified use a dummy function that always return true.
			if (!$.isFunction(options.filter)) {
				options.filter = function() {
					return true;
				}
			}
			
			return options;
		},
		
		_next: function(key, value, path) {
			var augmentedPath = this._augmentPath(path, key);
			
			if (this._options.filter.apply(this, [key, value, path])) {
				if (this._isArray(value)) {
					this._array(key, value, augmentedPath);
				}
				else if (utils.isObject(value)) {
					this._object(key, value, augmentedPath);
				}
				else if ($.isFunction(value)) {
					this._atomic(key, value, augmentedPath, this._options.onFunction);
				}
				else {
					this._atomic(key, value, augmentedPath, this._options.onAtomic);
				}
			}
		},
		
		_object: function(key, obj, path) {
			// Call the "onObject" callback if provided. If false is returned, the children properties are not parsed.
			var canContinue = this._atomic(key, obj, path, this._options.onObject);
		
			if (canContinue !== false) {
				for (var propertyKey in obj) {
					if (utils.hasOwnProperty(obj, propertyKey)) {
						this._next(propertyKey, obj[propertyKey], path);
					}
				}
			}
		},
		
		_array: function(key, array, path) {
			// Call the "onArray" callback if provided. If false is returned, the items are not parsed.
			var canContinue = this._atomic(key, array, path, this._options.onArray);

			if (canContinue !== false) {
				var unwrappedArray = array.peek();
			
				for (var i = 0, max = unwrappedArray.length; i < max; i += 1) {
					this._next(i, unwrappedArray[i], path);
				}
			}
		},
		
		_atomic: function(key, value, path, handler) {
			if ($.isFunction(handler)) {
				var args = {
					key: key,
					value: value,
					path: path,
					obj: this._current
				};
				
				return handler.apply(this._context, [args]);
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
	
	// Shelby.ObjectModifier
	// ---------------------------------
	
	var objectModifier = Shelby.ObjectModifier = {
		_current: null,
		_options: null,
		_context: null,
	
		process: function(obj, options, context) {
			this._reset(obj, options, context);
			return this._next("", obj, "");
		},
		
		_reset: function(obj, options, context) {
			this._current = obj;
			this._options = this._computeOptions(options);
			this._context = context;
		},
		
		_computeOptions: function(options) {
			if (!utils.isObject(options)) {
				options = {};
			}
			else {
				options = utils.clonePlainObject(options);
			}
			
			// To speed up things, if no filter are specified use a dummy function that always return true.
			if (!$.isFunction(options.filter)) {
				options.filter = function() {
					return true;
				}
			}
			
			return options;
		},
		
		_next: function(key, value, path) {
			var augmentedPath = this._augmentPath(path, key);
			
			if (this._options.filter.apply(this, [key, value, path])) {
				if (this._isArray(value)) {
					return this._array(key, value, augmentedPath);
				}
				else if (utils.isObject(value)) {
					return this._object(key, value, augmentedPath);
				}
				else if ($.isFunction(value)) {
					return this._atomic(key, value, augmentedPath, this._options.onFunction);
				}
				else {
					return this._atomic(key, value, augmentedPath, this._options.onAtomic);
				}
			}
			
			return value;
		},
		
		_object: function(key, obj, path) {
			for (var propertyKey in obj) {
				if (utils.hasOwnProperty(obj, propertyKey)) {
					obj[propertyKey] = this._next(propertyKey, obj[propertyKey], path);
				}
			}
			
			return this._atomic(key, obj, path, this._options.onObject);
		},
		
		_array: function(key, array, path) {
			var unwrappedArray = array.peek();
		
			for (var i = 0, max = unwrappedArray.length; i < max; i += 1) {
				unwrappedArray[i] = this._next(i, unwrappedArray[i], path);
			}
			
			return this._atomic(key, array.apply(array,[unwrappedArray]), path, this._options.onArray);
		},
		
		_atomic: function(key, value, path, handler) {
			if ($.isFunction(handler)) {
				var args = {
					key: key,
					value: value,
					path: path,
					obj: this._current
				}
				
				return handler.apply(this._context, [args]);
			}
			
			return value;
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
	
	// Shelby.Model
	// ---------------------------------
	
	Shelby.Model = function(data) {
		// Extenders applyed to all the observables at model instanciation.
		// The arrays contains objects having the following structure:
		//  - name: the name of the registred extenders.
		//  - options: the options provided to the extenders.
		this._commonExtenders = [{ name: "shelbyPausableObservable", options: true }];
		this._arrayExtenders = [{ name: "shelbyArrayObservable", options: true }];
	
		this._applyExtenders(data);
	
		// Copy all the data properties to this model.
		$.extend(this, data);
	},
	
	Shelby.Model.prototype = {
		_applyExtenders: function(data) {
			var filterModel = function(property) {
				if (Shelby.Model.MARKER_PROPERTY in property.value) {
					return false;
				}
			};
		
			var applyExtenders = function(extenders) {
				if (extenders.length === 0) {
					return null;
				}
			
				return function(property) {
					property.value.extend(extenders);
				}
			};
		
			// Extends all the observables that have not already been extended. Extended observables are distinguishable by the fact 
			// that they are already part of a model. Filtering all the model ensure that an observable is not extended twice.
			objectParser.process(data, {
				filter: function(key, value) {
					return ko.isObservable(value) || utils.isObject(value);
				},
				onObject: filterModel,
				onArray: applyExtenders(utils.arrayMapToObject(this._commonExtenders.concat(this._arrayExtenders), "name", "options")),
				onFunction: applyExtenders(utils.arrayMapToObject(this._commonExtenders, "name", "options"))
			});
		},
		
		unwrap: function() {
			var unwrapped = utils.clonePlainObject(this),
				propertiesToRemove = [Shelby.Model.MARKER_PROPERTY, "_subscriptions", "_commonExtenders", "_arrayExtenders"];
			
			$.each(utils.objectKeys(Shelby.Model.prototype).concat(propertiesToRemove), function(propertyKey) {
				delete unwrapped[this];
			});
			
			return unwrapped;
		}
	};
	
	Shelby.Model.MARKER_PROPERTY = "__shelby_model__";
	Shelby.Model.prototype[Shelby.Model.MARKER_PROPERTY] = true;
	
	Shelby.Model.extend = extend;
	
	// Shelby extenders
	// ---------------------------------
	
	Shelby.extender = function(data) {
		// Do parsing...
		
		// Extend...
	};
	
	var subscription = {
		// Current subscriptions informations.
		// The array contains objects having the following structure:
		// 	- id : the subscriptions as a unique identifier.
		//	- propertySubscriptions: an	array having the subscriptions data for each properties of the subscriptions.
		//  - isPause: true if the subscription is paused, false otherwise.
		_subscriptions = [],
	
		subscribe: function(/* [propertyFilters], [options], callback */) {
			var length = arguments.length;
		
			if (length > 0) {
				var callback = arguments[length -1];
				
				if (!$.isFunction(callback)) {
					throw new Error("\"callback\" must be a function.");
				}
			
				if (length >= 3) {
					return this._subscribeWithThreeArguments.apply(this, arguments);
				}
				else if (length === 2) {
					return this._subscribeWithTwoArguments.apply(this, arguments);
				}
				else if (length === 1) {
					return this._subscribeWithSingleArgument.apply(this, arguments);
				}
			}
			
			throw new Error("You must provide at least a valid callback.");
		},
		
		_subscribeWithThreeArguments: function(propertyFilters, options, callback) {
			options = options || {};
		
			if (!utils.isObject(options)) {
				throw new Error("\"options\" must be an object literal.");
			}
			
			var args = this._getPropertyFilterArguments(propertyFilters).concat([options, callback]);
			
			return this._addSubscription.apply(this, args);
		},
		
		_subscribeWithTwoArguments: function(propertyFiltersOrOptions, callback) {
			var args = null;
			
			if (!this._isSubscriptionOptions(propertyFiltersOrOptions)) {
				args = this._getPropertyFilterArguments(propertyFiltersOrOptions).concat({}, callback);
			}
			else {
				args = [null, null, arguments[0], callback];
			}
		
			return this._addSubscription.apply(this, args);
		},
		
		_subscribeWithSingleArgument: function(callback) {
			return this._addSubscription(null, null, {}, callback);
		},
		
		_isSubscriptionOptions: function(value) {
			return !utils.isNull(value) && utils.isPartiallyImplementing(value, ["callbackTarget", "event", "subscriber"]);
		},
		
		_getPropertyFilterArguments: function(propertyFilters) {
			var args = null;
		
			if (utils.isNull(propertyFilters)) {
				args = [null, null];
			}
			else if ($.isArray(propertyFilters)) {
				args = [propertyFilters, null];
			}
			else if (utils.isObject(propertyFilters)) {
				if ($.isArray(propertyFilters.include)) {
					args = [propertyFilters.include, null];
				}
				else if ($.isArray(propertyFilters.exclude)) {
					args = [null, propertyFilters.exclude];
				}
			}

			if (utils.isNull(args)) {
				throw new Error("Property filter type is not supported.");
			}
			
			return args;
		},
		
		_addSubscription: function(include, exclude, options, callback) {
			var that = this;

			// Evaluator that handles the include / exclude properties behavior by evaluating the property path 
			// against the specified paths.
			var canSubscribeToProperty = null;
			
			// Create an evaluator that will filter the subscribable properties by the provided include / exclude paths.
			var filterByPaths = function(paths, wildcardReplacement) {
				return function() {
					var computedPaths = this._computeSubscriptionPaths(include, wildcardReplacement);
					
					canSubscribeToProperty = function(path) {
						var comparer = function(evaluator, currentPath) {
							return evaluator(currentPath);
						};
						
						return utils.arrayIndexOf(computedPaths, path, comparer) !== -1;
					};
				};
			};
			
			if ($.isArray(include)) {
				canSubscribeToProperty = filterByPaths(include, "[^]*");
			}
			else if ($.isArray(exclude)) {
				canSubscribeToProperty = filterByPaths(exclude, "[^]+");
			}
			else {
				canSubscribeToProperty = function() {
					return true;
				};
			}
			
			var subscription = {
				id: utils.generateGuid(),
				propertySubscriptions: [],
				isPause: false
			};
			
			// Handler called to subscribe to a property.
			var subscriber = $.isFunction(options.subscriber) ? options.subscriber : this._propertySubscriber;
		
			var action = function(property) {
				var proxyCallback = function(newValue) {
					callback.apply(this, [newValue, property.path]);
				};
				
				var propertySubscription = subscriber(utils.clonePlainObject(property), {
					id: subscription.id,
					callback: proxyCallback,
					callbackTarget: options.callbackTarget,
					event: options.event
				});
				
				subscription.propertySubscriptions.push(propertySubscription);
			};
			
			// Iterate on the object properties and add the subscriptions to all the mapped properties 
			// matching the filters.
			objectParser.process(this, {
				filter: function(property) {
					// A property is subscribable if it is an observable, has the extension function "pausableSubscription" and evaluates to true.
					return ko.isObservable(property.value) && utils.hasProperty(property.value, "pausableSubscription") && canSubscribeToProperty(property.path);
				},
				onArray: action,
				onFunction: action
			});
			
			this._subscriptions.push(subscription);
			
			return {
				id: subscription.id,
				pause: function() {
					that._pauseSubscription(subscription);
				},
				resume: function() {
					that._resumeSubscription(subscription);
				},
				dispose: function() {
					that._disposeSubscription(subscription);
				},
				isPause: function() {
					return subscription.isPause;
				}
			};
		},
		
		_computePaths: function(paths, wildcardReplacement) {
			return utils.arrayMap(includePaths, function(includePath) {
				if (utils.isString(includePath)) {
					// If the path contains wildcards, create a function that use a regular expression to match the current path against the pattern.
					if (includePath.indexOf("*") !== -1) {
						// Transform the wildcard caracter '*' with the "wildcardReplacement".
						var pattern = new RegExp(includePath.replace(/\*/g, wildcardReplacement));
					
						return function(currentPath) {
							return pattern.test(currentPath);
						};
					}
					
					// Otherwise create a function that use the equality operator to match the current path against the path.
					return function(currentPath) {
						return includePath === currentPath;
					};
				}
				
				throw new Error(utils.stringFormat("Path {1} must be a string.", index));
			});
		},
		
		_propertySubscriber: function(property, subscription) {
			return property.value.pausableSubscription.apply(property.value, subscription);
		},
		
		_pauseSubscription: function(subscription) {
			this._updateSubscription(subscription.id, function(propertySubscription) {
				propertySubscription.pause();
			});
			
			subscription.isPause = true;
		},
		
		_resumeSubscription: function(subscription) {
			this._updateSubscription(subscription.id, function(propertySubscription) {
				propertySubscription.resume();
			});
			
			subscription.isPause = false;
		},
		
		_disposeSubscription: function(subscription) {
			this._updateSubscription(subscription.id, function(propertySubscription) {
				propertySubscription.dispose();
			});
			
			utils.arrayRemoveValue(this._subscriptions, subscription.id, function(current) {
				return current.id === subscription.id;
			});
		},
		
		_updateSubscription: function(subscriptionId, action) {
			var subscription = utils.arrayGetValue(this._subscriptions, subscriptionId, function(current) {
				return current.id === subscriptionId;
			});
			
			if (!utils.isNull(subscription)) {
				$.each(subscription.propertySubscriptions, function() {
					action(this);
				});
			}
		},
		
		// Dispose of all the subscriptions.
		unsuscribeAll: function() {
			var that = this;
		
			$.each(this._subscriptions, function() {
				that._updateSubscription(this.id, function(propertySubscription) {
					propertySubscription.dispose();
				});
			});
			
			this._subscriptions = [];
		},
		
		// Pause all the subscriptions.
		mute: function() {
			var that = this;
		
			$.each(this._subscriptions, function() {
				that._pauseSubscription(this);
			});
		},
		
		// Resume all the subscriptions.
		unmute: function() {
			var that = this;
		
			$.each(this._subscriptions, function() {
				that._resumeSubscription(this);
			});
		}
	};
	
	var transactional = {
	};
	
	Shelby.extender.object = function(data) {
		// var filterModel = function(property) {
			// if (Shelby.Model.MARKER_PROPERTY in property.value) {
				// return false;
			// }
		// };
	
		// var applyExtenders = function(extenders) {
			// if (extenders.length === 0) {
				// return null;
			// }
		
			// return function(property) {
				// property.value.extend(extenders);
			// }
		// };
	
		// // Extends all the observables that have not already been extended. Extended observables are distinguishable by the fact 
		// // that they are already part of a model. Filtering all the model ensure that an observable is not extended twice.
		// objectParser.process(data, {
			// filter: function(key, value) {
				// return ko.isObservable(value) || utils.isObject(value);
			// },
			// onObject: filterModel,
			// onArray: applyExtenders(utils.arrayMapToObject(this._commonExtenders.concat(this._arrayExtenders), "name", "options")),
			// onFunction: applyExtenders(utils.arrayMapToObject(this._commonExtenders, "name", "options"))
		// });
	};
	
	Shelby.extender.object.extenders = [{ name: "shelbyPausableObservable", options: true }]
	
	Shelby.extender.object.fn = {};
	
	$.extend(Shelby.extender.object.fn, subscription);
	$.extend(Shelby.extender.object.fn, transactional);
	
	Shelby.extender["observableArray"] = function() {
	};
	
	Shelby.extender["observableArray"]["fn"] = {
	};
	
	Shelby.extender["observable"] = function() {
	};
	
	Shelby.extender["observable"]["fn"] = {
	};
	
	// Observable extenders
	// ---------------------------------
	
	ko.extenders.shelbyPausableObservable = function(target) {
		// When true, all the subscriptions are pause.
		var pauseAllSubscriptions = false;
	
		target.shelby = target.shelby || {};
	
		// Contains the id of the subscriptions that have been paused.
		target.shelby.pausedSubscriptions = [];
	
		// Instead of overriding the native knockout subscribe function, a function with
		// a new name is added to prevent pausing all the knockout native subscriptions
		// which would result in blocking native UI updates.
		target.shelby.pausableSubscription = function(subscriptionId, callback, callbackTarget /*, event */) {
			if (!$.isFunction(callback)) throw new Error("A callback function must be specified as the second argument.");
		
			// Remove the subscription id (arguments[0]) from the arguments before calling the native knockout subscription
			// function since it doesn't know about that property.
			[].shift.apply(arguments);
			
			// Define a proxy callback that implement the pausable behaviors to replace
			// the original one.
            var proxyCallback = function() {
                if (!target.shelby.isPause(subscriptionId)) {
                    // If this observable is not paused for this subscription, call the original
					// callback with the original arguments.
					callback.apply(callbackTarget || pausableSubscription, arguments);
                }
            };

            arguments[0] = proxyCallback;

			// Call the original knockout subscription function.
			var subscription = target.subscribe.apply(target, arguments);
			
			var pausableSubscription = {
				target: target,
				pause: function() {
					target.shelby.pause(subscriptionId);
				},
				resume: function() {
					target.shelby.resume(subscriptionId);
				},
				dispose: function() {
					// Make sure we dont leave any trace of the subscription.
					utils.arrayRemoveValue(target.shelby.pausedSubscriptions, subscriptionId);
					
					// Dispose KO subscription.
					subscription.dispose();
				}
			}
			
			return pausableSubscription;
		};
		
		target.shelby.pause = function(/* [subscriptionId] */) {
			if (arguments.length === 0 || utils.isNull(arguments[0])) {
				pauseAllSubscriptions = true;
			}
			else {
				var subscriptionId = arguments[0];
				
				if (utils.arrayIndexOf(target.shelby.pausedSubscriptions, subscriptionId) === -1) {
					target.shelby.pausedSubscriptions.push(subscriptionId);
				}
			}
		};
		
		target.shelby.resume = function(/* [subscriptionId] */) {
			if (arguments.length === 0 || utils.isNull(arguments[0])) {
				pauseAllSubscriptions = false;
			}
			else {
				utils.arrayRemoveValue(target.shelby.pausedSubscriptions, arguments[0]);
			}
		};
		
		target.shelby.isPause = function(/* [subscriptionId] */) {
			var subscriptionId = arguments[0];
		
			if (pauseAllSubscriptions) {
				return true;
			}
			else if (arguments.length === 0 || utils.isNull(subscriptionId)) {
				return pauseAllSubscriptions;
			}
			
			return utils.arrayIndexOf(target.shelby.pausedSubscriptions, subscriptionId) !== -1;
		};
	};
	
	// ko.extenders.shelbyArrayObservable = function(target) {
		// if (!$.isArray(target.peek())) throw new Error("Observable underlying value must be an array.");
		
		// target.push = function(value, event) {
			// if (utils.isNull(value)) throw new Error("\"value\" must be non-null.");
			
			// target.valueWillMutate();
			
			// push(value);
			// notifySubscribers(event);
		// };
		
		// target.pushAll = function(values, event) {
			// if (!$.isArray(value)) throw new Error("\"values\" must be a non-null array.");
			
			// if (values.length > 0) {
				// target.valueWillMutate();
				
				// $.each(values, function() {
					// push(this);
				// });
				
				// notifySubscribers(event);
			// }
		// };
		
		// function push(value) {
			// if (isWrapped(value)) {
				// target.peek().push(value.unwrap());
			// }
			// else {
				// target.peek().push(value);
			// }
		// };
		
		// function notifySubscribers(event) {
			// if (utils.isString(event)) {
				// target.notifySubscribers(event);
			// }
			// else {
				// target.valueHasMutated();
			// }
		// };
		
		// function isWrapped(value) {
			// return utils.hasOwnProperty(value, "unwrap");
		// };
		
		// // // **** Permettre un "event" optionnel, s'il est spécifier ajouter l'élément directement au underlying array et fait ensuite un notifySubscriber (en fait probablement que toutes mes functions devraient permettre ça). ****
		// // $.each(["pop", "shift", "reverse", "sort", "splice", "slice"], function(i, propertyKey) {
			// // target[propertyKey] = function() {
				// // return this.inner[propertyKey].apply(target, arguments);
			// // };
		// // });
	// };
	
	// Shelby.Ajax
	// ---------------------------------
	
	var ajax = Shelby.Ajax = {
		// Send an AJAX request.
		//  - options: Any jQuery AJAX options (http://api.jquery.com/jQuery.ajax),
		//    options "url" and "type" are mandatory.
		send: function(options) {
			if (utils.isNull(options)) throw new Error("\"options\" must be a non null object literal.");
			if (utils.isNullOrEmpty(options.url)) throw new Error("\"options.url\" must be a non null or empty string.");
			if (utils.isNullOrEmpty(options.type)) throw new Error("\"options.type\" must be a non null or empty string.");
			
			var mergedOptions = $.extend({}, Shelby.Ajax.options, options);
			
			// Default data content type is the JSON format.
			if (!utils.isNull(mergedOptions.data)) {
				mergedOptions.contentType = mergedOptions.contentType || "application/json";
			}
			
			var jqxhr = $.ajax(mergedOptions);
			
			if (Shelby.debug === true) {
				jqxhr.fail(this._onRequestFail);
			}
			
			return jqxhr;
		},
		
		_onRequestFail: function(jqxhr, textStatus, errorThrown) {			
			var data = utils.isNullOrEmpty(this.data) ? "{NO_DATA}" : JSON.stringify(this.data);
			var exception = utils.isNullOrEmpty(textStatus) ? "{NO_EXCEPTION}" : textStatus;
			var httpError = utils.isNullOrEmpty(errorThrown) ? "{NO_HTTP_ERROR}" : errorThrown;
			
			var message = utils.stringFormat(
				"An error occured while performing an AJAX request of type {1} to {2} with data {3}.\nStatus code: {4}\nStatus " + 
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
	//	- Requests are made using the JSON format.
	//  - Caching is disabled.
	ajax.options = $.extend({}, $.ajaxSettings, {
		dataType: "json",
		cache: false
	});
	
	// Available AJAX methods.
	ajax.Methods = {
		Get: "GET",
		Post: "POST",
		Put: "PUT",
		Delete: "DELETE"
	};

    // Define a unique method for every AJAX methods.
    $.each(ajax.Methods, function(method, httpVerb) {
        ajax[method.toLowerCase()] = function(options) {
            options.type = httpVerb;
			
            return this.send(options);
        };
    });
	
	// Shelby.Mapper
	// ---------------------------------
	
	var mapper = Shelby.Mapper = {
		fromJS: function(obj, options) {
			return ko.viewmodel.fromModel.apply(ko.viewmodel, arguments);
		},
		
		toJS: function(obj) {
			return ko.viewmodel.toModel.apply(ko.viewmodel, arguments);
		},
		
		update: function() {
			return ko.viewmodel.updateFromModel.apply(ko.viewmodel, arguments);
		}
	};
	
	// Shelby.ViewModel
	// ---------------------------------
	
	Shelby.ViewModel = function() {
		this._element = null;
		
		this._isBinded = false;
	};
	
	Shelby.ViewModel.prototype = {
		// Must be override by you to support REST or RPC HTTP request for 
		// "all" / "detail" / "add" / "update" / "remove" functions. 
		// For REST request, "_url" must be a string representing the endpoint URL.
		// For RPC request, "_url" must be an object literal having the following structure:
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
		
		// If defined by you, it will be invoked after binding the view model with the DOM.
		_afterBind: null,
		
		// If defined by you, it will be invoked before executing a fetch AJAX request.
		//  - operationContext: See "_createAjaxOperationContext" for the object structure.
		_beforeFetch: null,
		
		// If defined by you, it will be invoked after the execution of a fetch AJAX request.
		//  - operationContext: See "_createAjaxOperationContext" for the object structure.
		_afterFetch: null,
		
		// If defined by you, it will be invoked before executing a save AJAX request.
		// ********MANQUE PARAMS
		_beforeSave: null,
		
		// If defined by you, it will be invoked after the execution of a save AJAX request.
		// ********MANQUE PARAMS
		_afterSave: null,
		
		// Create a Shelby model from raw data.
		// By default, a simple Shelby model is created, you can override this function to create an extended 
		// Shelby model, use specific mapping options, extend observables, etc...
		//  - data: The raw data that will be transformed into a Shelby model.
		//  - operationContext: An object literal thats represents the current operation. The type of the operation can be identified 
		//    with the property "type" and will match a value of the "Shelby.ViewModel.OperationType" enumeration.
		//    The object structure will be:
		//     - if "type" is Shelby.ViewModel.OperationType.AJAX: see "_createAjaxOperationContext" for the object structure.
		// Returns null if a Shelby model cannot be created from the data, otherwise a Shelby model.
		_createModel: function(data, operationContext) {
			return new Shelby.Model(data);
		},
		
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
		_handleError: null,
	
		// Apply the KO bindings with the view model.
		//  - element : a DOM or jQuery element to use as the root.
		bind: function(element) {
			this._element = this._getDomElement(element);
			
			if ($.isFunction(this._beforeBind)) {
				var that = this;

				var callback = function() {
					that._applyBindings();
				};
					
				var isAsync = this._beforeBind.apply(this, [callback]);
				if (isAsync !== true) {
					this._applyBindings();
				}
			}
			else {
				this._applyBindings();
			}
		},
		
		_getDomElement: function(element) {
			if (utils.isjQueryObject(element) && element.length > 0) {
				element = element[0];
			}
			
			return element;
		},
		
		_applyBindings: function() {
			ko.applyBindings(this, this._element);
			
			this._isBinded = true;
			
			if ($.isFunction(this._afterBind)) {
				this._afterBind.apply(this);
			}
		},
		
		// Execute an AJAX GET request.
		// 	- 
		_ajaxFetch: function(options) {
			if (utils.isNull(options)) throw new Error("\"options\" must be a non null object literal.");
			if (utils.isNull(options.request)) throw new Error("\"options.request\" must be a non null object literal.");
			if (utils.isNullOrEmpty(options.request.url)) throw new Error("\"options.request.url\" must be a non null or empty string.");
		
			var that = this;
				
			var request = utils.clonePlainObject(options.request),
				operationContext = this._createAjaxOperationContext(request, ajax.Methods.Get);
			
			if ($.isFunction(this._beforeFetch)) {
				request.beforeSend = function() {
					// Prepend the original arguments with the operation context.
					var args = $.makeArray(arguments);
					args.unshift(operationContext);
					
					// The original jQuery AJAX "beforeSend" function support returning "false" to abort the
					// request, allow return value to support that behavior.
					return that._beforeFetch.apply(that, args);
				};
			}
			
			// Using a "proxy" deferred to add custom mapping / error handling logics through 
			// the AJAX promise handlers.
			var deferred = $.Deferred();
			
			// Execute the AJAX request.
			var ajaxPromise = ajax.get(request);
				
			ajaxPromise.done(function(response) {
				if (!utils.isNull(response)) {
					// If the caller did specify to NOT process the response, map the response properties to observables and transform objects to models.
					if (options.response.process !== false) {
						if ($.isFunction(options.response.extractor)) {
							response = options.response.extractor.apply(that, [response]);
						}
						
						////////////////////////////////
						
						response.nestedObject = {
							prop1: "prop1",
							prop2: "prop2",
							nestedObject: {
								prop1: "prop1",
								arrayProp: [{ prop1: "prop1" }, { prop1: "prop1" }, { prop1: "prop1" }]
							},
							arrayProp: ["prop1", "prop2", "prop3"]
						};
						
						////////////////////////////////
						
						// Convert the response properties to observables.
						response = mapper.fromJS(response, options.response.mapping);
						
						// Convert the mapped reponse object properties to models.
						objectModifier.process(response, {
							onObject: function(args) {
								return that._createModel(args.value, operationContext)
							}
						});
					}
				}
			
				deferred.resolve(response);
			});
			
			ajaxPromise.fail(function(jqxhr, textStatus) {
				var errorData = that._createAjaxRequestErrorData(operationContext, jqxhr, textStatus);
				
				this._onError(errorData);
				
				deferred.reject(errorData);
			});
			
			if ($.isFunction(this._afterFetch)) {
				ajaxPromise.always(function() {
					// Prepend the original arguments with the operation context.
					var args = $.makeArray(arguments);
					args.unshift(operationContext);
				
					that._afterFetch.apply(that, args);
				});
			}
			
			return deferred.promise();
		},
		
		// // action comme param ?
		// _ajaxSave: function(url, data, options) {
			// if (!utils.isObject(data)) 
				// throw new Error("\"data\" must be a valid literal or prototyped object.");
				
			// var isModel = data instanceof Shelby.Model;
			
			// // If the data is a Shelby model, convert it back to raw JavaScript.
			// var requestData = !isModel ? data : this._convertModelToJS.apply(this, [data, this._createRequestContext({
				// url
			// )]);
			
			// var ajaxOptions = $.extend({}, Shelby.ViewModel.ajaxSettings, {
				// url: url,
				// data: requestData
			// });
			
			// var that = this;
			
			// if ($.isFunction(this._beforeSave)) {
				// ajaxOptions._beforeSend = function() {
					// that._beforeSave.apply(that, [that._createRequestContext(ajaxOptions), data]);
				// };
			// }
			
			// // Using a "proxy" deferred to add custom mapping / error handling logics through 
			// // the promise operations.
			// var deferred = $.Deferred(),
				// request = factory.ajax().post(ajaxOptions);
				
			// // Handle success.
			// request.done(function(result) {
				// // If the caller did not specify to ignore mapping, convert the response data to a Shelby model.
				// if (utils.isNull(options) || options.preventResponseMapping !== true) {
					// result = that._createModel.apply(that, [result, that._createRequestContext(ajaxOptions)]);
				// }
			
				// deferred.resolve(data, result);
			// });
			
			// // Handle error.
			// request.fail(function(jqxhr, textStatus) {
				// var errorData = that._createRequestErrorData.apply(that, [ajaxOptions, jqxhr, textStatus]);
				
				// if ($.isFunction(that._handleError)) {
					// that._handleError.apply(that, [errorData]); // MANQUE LE MODEL ORIGINAL
				// }
			
				// deferred.reject(errorData);
			// });
				
			// if ($.isFunction(this._afterSave)) {
				// request.always(function() {
					// that._afterSave.apply(that, [that._createRequestContext(ajaxOptions)]);
				// });
			// }
			
			// return deferred.promise();
		// },
		
		_ajaxDelete: function() {
		},
		
		all: function(criteria) {
			var url = this._getUrl("all");
			
			return this._ajaxFetch({
				request: {
					url: url,
					data: criteria
				}
			});
		},
		
		detail: function(id) {
			var url = this._getUrl("detail");
			
			return this._ajaxGet({
				request: {
					url: url,
					data: {
						id: id
					}
				}
			});
		},
		
		add: function() {
		},
		
		update: function() {
		},
		
		remove: function() {
		},
		
		// _createRequestContext: function(ajaxOptions) {
			// return {
				// url: ajaxOptions.url,
				// verb: ajaxOptions.type,
				// data: ajaxOptions.data
			// };
		// },
		
		// Create a new AJAX operation context with the following structure:
		//  - type: Always Shelby.ViewModel.OperationType.Ajax
		//  - url: The request URL.
		//  - method: The AJAX method (see Shelby.Ajax.Methods).
		//  - data: The request data.
		_createAjaxOperationContext: function(request, method) {
			return {
				type: Shelby.ViewModel.OperationType.Ajax,
				url: request.url,
				method: method,
				data: request.data
			};
		},
		
		// _createExecutionErrorData: function(operationContext, message) {
			// return {
				// data: message,
				// operationContext : operationContext
			// }
		// },
		
		_createAjaxRequestErrorData: function(operationContext, jqxhr, textStatus) {
			var data = "";
			
			if (!utils.isNullOrEmpty(jqxhr.responseText)) {
				data = $.parseJSON(jqxhr.responseText);
			}
			else if (!utils.isNullOrEmpty(jqxhr.responseXML)) {
				data = $.parseXML(jqxhr.responseXML);
			}
			
			operationContext.statusCode = jqxhr.status;
			operationContext.statusText = jqxhr.statusText;
			operationContext.exception = textStatus;
		
			return {
				data: data,
				operationContext: operationContext
			};
		},
		
		_getUrl: function(operation) {
			if (!utils.isNullOrEmpty(this._url)) {
				if (utils.isString(this._url)) {
					return this._url;
				}
				else if (utils.isObject(this._url)) {
					var url = this._url[operation];
					
					if (utils.isNullOrEmpty(url)) {
						throw new Error(utils.stringFormat("The URL for the operation \"{0}\" is not specified.", operation));
					}
					
					return url;
				}
			}
			
			throw new Error("To use any of the AJAX operations, the \"_url\" property must be a non-null/empty string or a non-null object literal.");
		},
		
		_onError: function(data) {
			if ($.isFunction(that._handleError)) {
				that._handleError(data);
			}
		}
	};
	
	Shelby.ViewModel.OperationType = {
		Ajax: "AJAX"
	};
	
	Shelby.ViewModel.extend = extend;
	
	return Shelby;
}));