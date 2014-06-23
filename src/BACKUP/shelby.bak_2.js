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
	
	// Utils
	// ---------------------------------
	
	(function() {
		var objectHasOwnPropertySupported = $.isFunction(Object.hasOwnProperty),
			objectKeysSupported = $.isFunction(Object.keys),
			arrayIndexOfSupported = $.isFunction(Array.prototype.indexOf),
			arrayMapSupported = $.isFunction(Array.prototype.map),
			arrayFilterSupported = $.isFunction(Array.prototype.filter);
			
		var currentGuid = 0;
		
		Shelby.Utils = {
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
			hasOwnProperty: function(obj, key) {
				if (!objectHasOwnPropertySupported) {
					return key in obj;
				}
				
				return obj.hasOwnProperty(key);
			},
			
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
						}
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
			
			// arrayFilter: function(array, filter, context) {
				// if (!arrayFilterSupported) {
					// var filtered = [];
					
					// for (var i = 0, max = array.length; i < max; i += 1) {
						// if (filter.apply(context, [array[i], i, array]) === true) {
							// filtered.push(array[i]);
						// }
					// }
					
					// return filtered;
				// }
				
				// return array.filter(filter, context);
			// },
			
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
				
				return Object.keys(obj)
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
	})();
	
	var utils = Shelby.Utils;
	
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
	
	// Shelby.Parser
	// ---------------------------------
	
	(function() {
		Shelby.Parser = function() {
			this._current = null;
			this._options = null;
			this._context = null;
		};
		
		Shelby.Parser.prototype = {
			parse: function(obj, options, context) {
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
					}
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
			
			_array: function(key, array, path) {
				var proceed = this._scalar(key, array, path, parent, this._options.onArray);
			
				if (proceed !== false) {
					var unwrappedArray = array.peek();
				
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
	})();
	
	// Shelby extenders
	// ---------------------------------
	
	(function() {
		Shelby.Extenders = {};
		
		Shelby.Extenders.Type = {
			Object: 0,
			Array: 1,
			Scalar: 2
		}
		
		// Shelby.Extenders.subscribe
		// ---------------------------------
		
		Shelby.Extenders.subscribe = function(target, type) {
			if (type !== Shelby.Extenders.Type.Object) {
				target.extend(this.observableExtenders["*"]);
				
				if (type === Shelby.Extenders.Type.Array) {
					target.extend(this.observableExtenders["array"]);
				}
			}
			
			if (type !== Shelby.Extenders.Type.Scalar) {
				// Copy all the functions to the target.
				$.extend(target[namespace], new Shelby.Extenders.subscribe.fn(target));
			}
		};
		
		Shelby.Extenders.subscribe.fn = function(target) {
			if (utils.isNull(this._target)) {
				this._target = function() {
					return target;
				}
			}
			
			// Current subscriptions informations.
			// The array contains objects having the following structure:
			// 	- id : the subscriptions as a unique identifier.
			//	- propertySubscriptions: an	array having the subscriptions data for each properties of the subscriptions.
			//  - isPause: true if the subscription is paused, false otherwise.
			this._subscriptions = [];
		};
		
		Shelby.Extenders.subscribe.fn.prototype = {
			subscribe: function(callback, options) {
				if (utils.isNull(callback)) throw new Error("\"callback\" must be a function.");
				
				var that = this;
				
				options = options || {};
					
				// Evaluator that handles the include / exclude properties behavior by evaluating the property path 
				// against the specified paths.
				var canSubscribeToProperty = null;
				
				if ($.isArray(options.include)) {
					canSubscribeToProperty = function(path) {
						return utils.arrayIndexOf(options.include, path) !== -1;
					};
				}
				else if ($.isArray(options.exclude)) {
					canSubscribeToProperty = function(path) {
						return utils.arrayIndexOf(options.exclude, path) === -1;
					};
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
					if (canSubscribeToProperty(property.path)) {
						// Abstraction to add additional informations when a subscription is triggered.
						var proxyCallback = function(value) {
							var args = {
								path: property.path,
								parent: property.parent,
								subscription: subscription
							};
						
							// Give you more flexibility for the subscription arguments if you decide to write
							// a custom extender and use it throught the "subscriber" option.
							if (utils.isObject(value)) {
								$.extend(args, value);
							}
							else {
								args.value = value;
							}
						
							// Notify subscriber.
							callback.call(this, args);
						};
						
						// Subscribe to the property.
						var propertySubscription = subscriber(property, {
							id: subscription.id,
							callback: proxyCallback,
							callbackTarget: options.callbackTarget,
							event: options.event
						});
						
						subscription.propertySubscriptions.push(propertySubscription);
					}
				};
				
				// Iterate on the target properties to subscribe on all the observables matching criterias.
				factory.parser().parse(this._target(), {
					filter: function(key, value, path) {
						// A property can be subscribe to if it is an observable. Object are allowed but will never be handled. We cannot
						// ignore them because "target" can be an object literal and it will prevent all the children from being parsed.
						return key !== namespace && (ko.isObservable(value) || utils.isObject(value));
					},
					onArray: action,
					onFunction: action
				});
				
				this._subscriptions.push(subscription);
				
				// 
				$.extend(subscription, {
					add: function(obj) {
						that._addToSubscription(obj, subscription);
					},
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
				});
			
				return subscription;
			},
			
			_propertySubscriber: function(property, subscription) {
				return property.value[namespace].pausableSubscription(subscription.id, subscription.callback, subscription.callbackTarget, subscription.event);
			},
			
			_addToSubscription: function(obj, subscription) {
				if (ko.isObservable(obj) || utils.isObject(obj)) throw new Error("\"obj\" must be an object or an observable");
				
				
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
					that._disposeSubscription(this);
				});
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
		
		Shelby.Extenders.subscribe.observableExtenders = { 
			"*": {
				shelbySubscribe: true
			},
			"array": {
				shelbyArraySubscribe: true
			}
		};
		
		// Shelby.Extenders.edit
		// ---------------------------------
		
		Shelby.Extenders.edit = function(target, type) {
			if (type !== Shelby.Extenders.Type.Object) {
				target.extend(this.observableExtenders);
			}
			
			if (type !== Shelby.Extenders.Type.Scalar) {
				// Copy all the functions to the target.
				$.extend(target[namespace], new Shelby.Extenders.edit.fn(target));
			}
		};
		
		Shelby.Extenders.edit.fn = function(target) {
			if (utils.isNull(this._target)) {
				this._target = function() {
					return target;
				}
			}
			
			this.isEditing = false;
			
			// Options for the current edition. 
			// The object structure is:
			//  - include: An array of property paths that will compose the edition.
			//  - exclude: An array of property paths that will be exclude from the edition.
			this._editOptions = null;
		};
		
		Shelby.Extenders.edit.fn.prototype = {
			beginEdit: function(options) {
				if (!this.isEditing) {
					this._editOptions = options || {};
				
					this._executeEditOperation(function(property) {
						property.value[namespace].beginEdit();
					});
					
					this.isEditing = true;
				}
			},
			
			endEdit: function() {
				if (this.isEditing) {
					this._executeEditOperation(function(property) {
						property.value[namespace].endEdit();
					});
					
					this.isEditing = false;
				}
			},
			
			cancelEdit: function() {
				if (this.isEditing) {
					this._executeEditOperation(function(property) {
						property.value[namespace].cancelEdit();
					});
					
					this.isEditing = false;
				}
			},
			
			isEdited: function() {
				var ret = false;
			
				if (this.isEditing) {
					this._executeEditOperation(function(property) {
						if (property.value[namespace].isEdited) {
							ret = true;
							
							return false;
						}
					});
				}
				
				return ret;
			},
			
			_executeEditOperation: function(operation) {
				var that = this;
				
				// Evaluator that handles the include / exclude properties behavior by evaluating the property path 
				// against the specified paths.
				var canSubscribeToProperty = null;
				
				if ($.isArray(this._editOptions.include)) {
					canSubscribeToProperty = function(path) {
						return utils.arrayIndexOf(that._editOptions.include, path) !== -1;
					};
				}
				else if ($.isArray(this._editOptions.exclude)) {
					canSubscribeToProperty = function(path) {
						return utils.arrayIndexOf(that._editOptions.exclude, path) === -1;
					};
				}
				else {
					canSubscribeToProperty = function() {
						return true;
					};
				}
			
				var action = function(property) {
					if (canSubscribeToProperty(property.path)) {
						return operation(property);
					}
				};
			
				// Iterate on the target properties to execute the operation on all the observables matching criterias.
				factory.parser().parse(this._target(), {
					filter: function(key, value, path) {
						// A property can be edited if it is an observable. Object are allowed but will never be handled. We cannot ignore
						// them because "target" can be an object literal and it will prevent all the children from being parsed.
						return key !== namespace && (ko.isObservable(value) || utils.isObject(value));
					},
					onArray: action,
					onFunction: action
				});
			}
		};
		
		Shelby.Extenders.edit.observableExtenders = {
			shelbyEdit: true
		};
		
		// Shelby.Extenders.utility
		// ---------------------------------
		
		Shelby.Extenders.utility = function(target, type) {
			if (type !== Shelby.Extenders.Type.Scalar) {
				// Copy all the functions to the target.
				$.extend(target[namespace], new Shelby.Extenders.utility.fn(target));
			}
		};
		
		Shelby.Extenders.utility.fn = function(target) {
			if (utils.isNull(this._target)) {
				this._target = function() {
					return target;
				}
			}
		};
		
		Shelby.Extenders.utility.fn.prototype = {
			reset: function(value, options) {
				var that = this;
				
				var value = null,
					options = {};
				
				if (utils.isObject(arguments[0])) {
					options = arguments[0];
				}
				else if (utils.isObject(arguments[1])) {
					value = arguments[0];
					options = arguments[1];
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
					filter: function(key, value, path) {
						// A property can be reset if it is an observable. Object are allowed but will never be handled. We cannot ignore
						// them because "target" can be an object literal and it will prevent all the children from being parsed.
						return key !== namespace && (ko.isObservable(value) || utils.isObject(value));
					},
					onFunction: action
				});
			}
		};

		// Shelby.PropertyExtender
		// ---------------------------------
		
		Shelby.PropertyExtender = function() {
		};
		
		Shelby.PropertyExtender.prototype = {
			add: function(target, extenders) {
				if (utils.isNull(target)) throw new Error("\"target\" must be an object.");
				if (utils.isNull(extenders)) throw new Error("\"extenders\" must be an object literal.");
			
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
						filter: function(key, value) {
							// A property can be extended if it is an observable or an object.
							return key !== namespace && (ko.isObservable(value) || utils.isObject(value));
						},
						onObject: action(Shelby.Extenders.Type.Object),
						onArray: action(Shelby.Extenders.Type.Array),
						onFunction: action(Shelby.Extenders.Type.Scalar)
					});
				}
			},
			
			remove: function(target) {
				if (utils.isNull(target)) throw new Error("\"target\" must be an object.");
			
				var action = function(property) {
					delete property.value[namespace];
				};
			
				factory.parser().parse(target, {
					filter: function(key, value) {
						return (ko.isObservable(value) || utils.isObject(value)) && utils.hasProperty(value, namespace);
					},
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
				var propertyExtenders = extenders["*"];
				
				if (!utils.isNull(extenders[property.path])) {
					propertyExtenders = propertyExtenders.concat(extenders[property.path]);
				}
			
				// Apply the retrieved extenders.
				$.each(propertyExtenders, function() {
					this.apply(this, [property.value, type]);
				});
			}
		};
		
		Shelby.PropertyExtender.extend = extend;
		
		// All extensions are added into a custom "shelby" namespace to avoid poluating the 
		// root of objects or observables.
		var namespace = Shelby.PropertyExtender.namespace = "shelby";
		
		// Observable extenders
		// ---------------------------------
		
		ko.extenders.shelbySubscribe = function(target) {
			// When true, all the subscriptions are pause.
			var pauseAllSubscriptions = false;
			
			$.extend(target[namespace], {
				// Contains the id of the subscriptions that have been paused.
				//pausedSubscriptions: [],
			
				pausableSubscription: function(/* [subscriptionId], callback, [callbackTarget], [event] */) {
					var subscriptionId = arguments[0];
					
					if (!utils.isString(subscriptionId)) {
						subscriptionId = null;
					}
					else {
						// Remove the subscription id (arguments[0]) from the arguments before calling the native knockout subscription
						// function since it doesn't know about that property.
						[].shift.apply(arguments);
					}
					
					var callback = arguments[0],
						callbackTarget = arguments[1];
						
					if (!$.isFunction(callback)) {
						throw new Error("First or second argument must be a callback function.");
					}
			
					var that = this;
					
					// Define a proxy callback that implement the pausable behaviors to replace
					// the original one.
					var proxyCallback = function() {
						//if (!that.isPause(subscriptionId)) {
						if (!pauseAllSubscriptions && !pausableSubscription.isPause) {
							// If this observable is not paused for this subscription, call the original
							// callback with the original arguments.
							
							// RAJOUTER LA SUBSCRIPTION COMME DERNIER ARGUMENT
							callback.apply(callbackTarget || pausableSubscription, arguments);
						}
					};

					arguments[0] = proxyCallback;

					// Call the original knockout subscription function.
					var subscription = target.subscribe.apply(target, arguments);
					
					var pausableSubscription = {
						isPause: false,
						
						pause: function() {
							//that.pause(subscriptionId);
							this.isPause = true;
						},
						resume: function() {
							this.isPause = false;
						
							//that.resume(subscriptionId);
						},
						dispose: function() {
							// // Make sure we dont leave any trace of the subscription.
							// utils.arrayRemoveValue(that.pausedSubscriptions, subscriptionId);
							// Dispose KO subscription.
							
							
							subscription.dispose();
						}
					}
					
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
				
				// pause: function(/* [subscriptionId] */) {
					// if (arguments.length === 0 || utils.isNull(arguments[0])) {
						// pauseAllSubscriptions = true;
					// }
					// else {
						// var subscriptionId = arguments[0];
						
						// if (utils.arrayIndexOf(this.pausedSubscriptions, subscriptionId) === -1) {
							// this.pausedSubscriptions.push(subscriptionId);
						// }
					// }
				// },
				
				// resume: function(/* [subscriptionId] */) {
					// if (arguments.length === 0 || utils.isNull(arguments[0])) {
						// pauseAllSubscriptions = false;
					// }
					// else {
						// utils.arrayRemoveValue(this.pausedSubscriptions, arguments[0]);
					// }
				// },
				
				// isPause: function(/* [subscriptionId] */) {
					// var subscriptionId = arguments[0];
				
					// if (pauseAllSubscriptions) {
						// return true;
					// }
					// else if (arguments.length === 0 || utils.isNull(subscriptionId)) {
						// return pauseAllSubscriptions;
					// }
					
					// return utils.arrayIndexOf(this.pausedSubscriptions, subscriptionId) !== -1;
				// }
			});
			
			return target;
		};
		
		ko.extenders.shelbyArraySubscribe = function(target) {
			$.extend(target[namespace], {
				pausableArraySubscription: function(/* [subscriptionId], callback, [callbackTarget], [event] */) {
					// If the first argument is a "subscriptionId" then the callback function is the second argument, 
					// otherwise it is the first one.
					var callbackIndex = utils.isString(arguments[0]) ? 1 : 0,
						callback = arguments[callbackIndex];
					
					if (!$.isFunction(callback)) {
						throw new Error("First or second argument must be a callback function.");
					}
					
					// The array changes cannot be process when the actual subscription is targeting the "beforeChange" event
					// because it requires to process the difference behavior *********** bla *********
					if (arguments[callbackIndex + 2] !== "beforeChange") {
						var previousArray = null;
		
						// Dont need to be a "pausable subscription" because we never stop tracking changes to the array,
						// even if the main subscription is paused.
						target.subscribe(function(array) {
							previousArray = utils.cloneArray(array);
						}, null, "beforeChange");
					
						// Proxy callback function adding the array changes behavior.
						arguments[callbackIndex] = function(newArray) {
							var differences = ko.utils.compareArrays(previousArray, newArray),
								added = [],
								removed = [];
							
							$.each(differences, function() {
								if (this.status === "added") {
									added.push(this.value);
								}
								else if (this.status === "deleted") {
									removed.push(this.value);
								}
							});
							
							if (added.length > 0) {
								callback.apply(this, [{ value: added, action: "added" }]);
							}
							
							if (removed.length > 0) {
								callback.apply(this, [{ value: removed, action: "removed" }]);
							}
						};
					}
					
					// Add the subscription.
					return this.pausableSubscription.apply(this, arguments);
				}
			});
			
			return target;
		};
		
		ko.extenders.shelbyEdit = function(target) {
			if (!$.isFunction(target[namespace].pause) || !$.isFunction(target[namespace].resume)) 
				throw new Error(utils.stringFormat("\"shelbyEditable\" can only extends an observable having \"{1}.pause\" and \"{1}.resume\" functions.", namespace));
		
			$.extend(target[namespace], {
				current: target.peek(),
				
				isEdited: false,
				isEditing: false,
				
				beginEdit: function() {
					if (!this.isEditing) {
						this.current = target.peek();
						
						// Prevent the propagation of the notifications to subscribers before an
						// explicit call to "endEdit" function has been made.
						target[namespace].pause();
						
						// Activate edition.
						this.isEditing = true;
					}
				},
				
				endEdit: function() {
					if (this.isEditing && this.isEdited) {
						this.current = target.peek();
					}
					
					if (this.isEditing) {
						target[namespace].resume();
					}
					
					// When the notifications are resumed, if the observable has been edited force a 
					// notification since the previous notifications has been "eat".
					if (this.isEditing && this.isEdited) {
						target.valueWillMutate();
						target.valueHasMutated();
					}
									
					this.isEditing = false;
					this.isEdited = false;
				},
				
				cancelEdit: function() {
					if (this.isEditing && this.isEdited) {
						target(this.current);
					}
					
					if (this.isEditing) {
						// Defer the "resume" to prevent synchronization problem.
						setTimeout(function() {
							target[namespace].resume();
						}, 10);
					}
					
					this.isEditing = false;
					this.isEdited = false;
				}
			});
			
			target.subscribe(function(value) {
				if (target[namespace].isEditing && !target[namespace].isEdited) {
					if ($.isArray(value)) {
						target[namespace].isEdited = ko.utils.compareArrays(target[namespace].current, value).length === 0;
					}
					else {
						target[namespace].isEdited = value !== target[namespace].current;
					}
				}
			});
			
			return target;
		};
	})();
	
	// Shelby.Ajax
	// ---------------------------------
	
	(function() {
		Shelby.Ajax = function() {
		};
	
		Shelby.Ajax.prototype = {
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
		Shelby.Ajax.options = $.extend({}, $.ajaxSettings, {
			dataType: "json",
			cache: false
		});
		
		var httpVerbs = ["GET", "POST", "PUT", "DELETE"];
		
		// Define a unique method for every HTTP verbs.
		$.each(httpVerbs, function(i, verb) {
			Shelby.Ajax.prototype[verb.toLowerCase()] = function(options) {
				options.type = verb;
				
				return this.send(options);
			};
		});
		
		Shelby.Ajax.extend = extend;
	})();
	
	// Shelby.Mapper
	// ---------------------------------
	
	(function() {
		Shelby.Mapper = function() {
		};
	
		Shelby.Mapper.prototype = {
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
		
		Shelby.Mapper.extend = extend;
	})();
	
	// Shelby.Factory
	//
	// Lazy singleton factories for Shelby dependency objects. This allow you to easily
	// modify the dependency objects prototype before Shelby use them.
	// ---------------------------------
	
	(function() {
		Shelby.Factory = function() {
			this._propertyExtender = null;
			this._parser = null;
			this._ajax = null;
			this._mapper = null;
		};
		
		Shelby.Factory.prototype = {
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
			}
		};
	})();
	
	var factory = Shelby.Factory.instance = new Shelby.Factory();
	
	// Shelby.ViewModel
	// ---------------------------------
	
	(function() {
		Shelby.ViewModel = function() {
			this._element = null;
			this._isBinded = false;
		};
		
		Shelby.ViewModel.prototype = {
			// ********************************************************
			// ********************************************************
			// ********************************************************
			// ********************************************************
			// ********************************************************
			// ********************************************************
			// ********************************************************
			// ********************************************************
			// REMETTRE EN DESSOUS EN AU LIEU D'UN ARRAY UTILISER UN OBJECT LITERAL COMME ÇA CE SERA PLUS FACILE POUR QUELQU'UN DE SUPPRIMER / REMPLACER DES EXTENDERS.
			_extenders: {
				"*": [Shelby.Extenders.utility, Shelby.Extenders.subscribe, Shelby.Extenders.edit]
			},
			// ********************************************************
			// ********************************************************
			// ********************************************************
			// ********************************************************
			// ********************************************************
			// ********************************************************
			// ********************************************************
			// ********************************************************
		
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
						
					var isAsync = this._beforeBind.call(this, callback);
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
			
			// Execute an AJAX GET request.
			// 	- 
			_fetch: function(options) {
				if (utils.isNull(options)) throw new Error("\"options\" must be a non null object literal.");
				if (utils.isNull(options.request)) throw new Error("\"options.request\" must be a non null object literal.");
				if (utils.isNullOrEmpty(options.request.url)) throw new Error("\"options.request.url\" must be a non null or empty string.");
			
				var that = this;
					
				var request = utils.clonePlainObject(options.request),
					operationContext = this._createAjaxOperationContext(request, Shelby.ViewModel.OperationMethod.Get);
				
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
				var ajaxPromise = factory.ajax().get(request);
					
				ajaxPromise.done(function(response) {
					if (!utils.isNull(response)) {
						// If the caller did specify to NOT process the response, map the response properties to observables and transform objects to models.
						if (options.response.process !== false) {
							if ($.isFunction(options.response.extractor)) {
								response = options.response.extractor.call(that, response);
							}
							
							// Convert the response properties to observables.
							response = that._fromJS(response, options.response.mapping);
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
		
		Shelby.ViewModel.OperationMethod = {
			Get: "GET",
			Post: "POST",
			Put: "PUT",
			Delete: "DELETE"
		};
		
		Shelby.ViewModel.OperationType = {
			Ajax: "AJAX"
		};
		
		Shelby.ViewModel.extend = extend;
	})();
	return Shelby;
}));