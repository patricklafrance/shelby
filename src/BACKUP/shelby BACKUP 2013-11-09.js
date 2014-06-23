(function(factory) {
    "use strict";
	
	if (typeof module === "object" && typeof module.exports === "object") {
		// Register as a CommonJS module.
		module.exports = factory(window.jQuery, window.ko, window.ko.viewmodel);
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
        // Expose as a global object.
        window.Shelby = factory(window.jQuery, window.ko, window.ko.viewmodel);
    }
}(function($, ko, koViewModel, undefined) {
	"use strict";
	
	var Shelby = {};
	
	// Current version.
	Shelby.VERSION = "0.1.0";
	
	// All extensions are added into a custom "shelby" namespace to avoid poluating the 
	// root of objects or observables.
	var namespace = Shelby.NAMESPACE = "shelby";
	
	// When true, additional informations will be output to the console.
	var debug = Shelby.debug = false;
	
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

			stringContains: function(str, value) {
				return str.indexOf(value) !== -1;
			},
			
			stringEndsWith: function(str, value) {
				return str.indexOf(value, str.length - 1) !== -1;		
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
			
			_array: function(key, array, path, parent) {
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
		var PropertyType = Shelby.PropertyType = {
			Object: 0,
			Array: 1,
			Scalar: 2
		};
		
		Shelby.Extenders = {};
		
		// Shelby.Extenders.base
		// ---------------------------------
		
		Shelby.Extenders.base = function() {
		};
		
		Shelby.Extenders.base.fn = function(target) {
			if (utils.isNull(this._target)) {
				this._target = function() {
					return target;
				}
			}
		};
		
		Shelby.Extenders.base.fn.extend = extend;
		
		// Shelby.Extenders.subscribe
		// ---------------------------------
			
		Shelby.Extenders.subscribe = function(target, type) {
			// Apply the observable extenders to everything that is an observable.
			if (type !== PropertyType.Object) {
				target.extend(this.observableExtenders["*"]);
				
				if (type === PropertyType.Array) {
					target.extend(this.observableExtenders["array"]);
				}
				
				target[namespace]._subscriptions = {};
			}
			
			if (type !== PropertyType.Scalar) {
				// Copy all the functions to the target.
				$.extend(target[namespace], new Shelby.Extenders.subscribe.fn(target));
			}
			else {
				// Added for commodity.
				target[namespace].subscribe = function() {
					target.subscribe.apply(target, arguments);
				}
			}
		};
		
		Shelby.Extenders.subscribe.fn = Shelby.Extenders.base.fn.extend({
			_initialize: function() {
				this._delegatedSubscriptions = {};
			},
		
			subscribe: function(callback, options) {
				if (utils.isNull(callback)) throw new Error("\"callback\" must be a function.");
				
				var that = this;
				
				options = options || {};
				options.array = options.array || {};
				
				// Evaluator that handles the include / exclude properties behavior
				// by evaluating the property path against the specified paths.
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
				this._addToSubscription(this._target(), subscription, canSubscribeToProperty, options, { path: "" });
				
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
					// Must consider a contextual path and parent to fully support the automatic subscription of array's new items.
					var path = property.path === "/" && !utils.isNullOrEmpty(context.path) ? context.path : context.path + property.path,
						parent = property.path === "/" && !utils.isNull(context.parent) ? context.parent : property.parent;
					
					if (propertyEvaluator(path)) {
						// Abstraction to add additional informations when a subscription is triggered.
						var proxyCallback = function(value, extendArguments, extender) {
							var args = {
								path: path,
								parent: parent,
								subscription: subscription
							};
							
							// Give you more flexibility for the subscription arguments if you decide to write
							// a custom extender and use it throught the "subscriber" option by letting you extend
							// the arguments that are passed to the subscriber.
							$.extend(args, extendArguments === true ? value : { value: value  });

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
						
							// Notify subscribers.
							subscription.callback.call(this, args);
						};
						
						// Subscribe to the property.
						var propertySubscription = subscriber(property, proxyCallback, options);
						
						// Save the property subscription on the property itself.
						property.value[namespace]._subscriptions[subscription.id] = propertySubscription;
						
						// Add the property to the group.
						subscription.members.push(property.value);
					}
				};
				
				// Iterate on the target properties to subscribe on all the observables matching criterias.
				factory.parser().parse(target, {
					filter: function(key, value, path) {
						// A property can be subscribe to if it is an observable. Object cannot be ignore because it will 
						// prevent us from parsing their children.
						return key !== namespace && (ko.isObservable(value) || utils.isObject(value));
					},
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
					filter: function(key, value, path) {
						// A property can be a candidate if it is an observable. Object cannot be ignore because
						// it will prevent us from parsing their children.
						return key !== namespace && (ko.isObservable(value) || utils.isObject(value));
					},
					onArray: action,
					onFunction: action
				});
			},
			
			_propertySubscriber: function(property, callback, options) {
				// var fct = options.array.evaluateChanges !== false && $.isArray(property.value.peek()) ? "pausableArraySubscription" : "pausableSubscription";
				
				// return property.value[namespace][fct](callback, options.callbackTarget, options.event);

				// In case of an array, if a specific event has been specified, the array changes evaluation
				// will not be applied.
				var evaluateArrayChanges = options.array.evaluateChanges !== false
					&& utils.isNullOrEmpty(options.event) && $.isArray(property.value.peek());

				var fct = evaluateArrayChanges ? "pausableArraySubscription" : "pausableSubscription";

				return property.value[namespace][fct](callback, options.callbackTarget, options.event);


				// return property.value[namespace].pausableSubscription(callback, options.callbackTarget, options.event);
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
				
				delete this._subscriptions[subscription.id];
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
		
		Shelby.Extenders.subscribe.fn.extend = extend;
		
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
			if (type !== PropertyType.Object) {
				target.extend(this.observableExtenders);
			}
			
			if (type !== PropertyType.Scalar) {
				// Copy all the functions to the target.
				$.extend(target[namespace], new Shelby.Extenders.edit.fn(target));
			}
		};
		
		Shelby.Extenders.edit.fn = Shelby.Extenders.base.fn.extend({
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
						property.value[namespace].beginEdit();
					});
					
					this.isEditing = true;
				}
			},

			endEdit: function(notifyOnce) {
				if (this.isEditing) {
					// Evaluator that handles the notifications count option.
					var canNotify = null;
					
					if (notifyOnce === true) {
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
						if (property.value[namespace].hasMutated) {
							context.count += 1;
						}
					
						property.value[namespace].endEdit(canNotify(context));
					};
				
					this._executeEditAction(action, {
						count: 0
					});
					
					this.isEditing = false;
				}
			},
			
			cancelEdit: function() {
				if (this.isEditing) {
					this._executeEditAction(function(property) {
						property.value[namespace].cancelEdit();
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
				
				// Evaluator that handles the include / exclude properties behavior
				// by evaluating the property path against the specified paths.
				var canEditProperty = null;
				
				if ($.isArray(this._editOptions.include)) {
					canEditProperty = function(path) {
						return utils.arrayIndexOf(that._editOptions.include, path) !== -1;
					};
				}
				else if ($.isArray(this._editOptions.exclude)) {
					canEditProperty = function(path) {
						return utils.arrayIndexOf(that._editOptions.exclude, path) === -1;
					};
				}
				else {
					canEditProperty = function() {
						return true;
					};
				}
			
				var execute = function(property) {
					if (canEditProperty(property.path)) {
						return action(property, context);
					}
				};
			
				// Iterate on the target properties to execute the action on all the observables matching criterias.
				factory.parser().parse(this._target(), {
					filter: function(key, value, path) {
						// A property can be edited if it is an observable. Object cannot be ignore because it will 
						// prevent us from parsing their children.
						return key !== namespace && (ko.isObservable(value) || utils.isObject(value));
					},
					onArray: execute,
					onFunction: execute
				});
			}
		});
		
		Shelby.Extenders.edit.fn.extend = extend;
		
		Shelby.Extenders.edit.observableExtenders = {
			shelbyEdit: true
		};
		
		// Shelby.Extenders.utility
		// ---------------------------------
		
		Shelby.Extenders.utility = function(target, type) {
			if (type !== PropertyType.Scalar) {
				// Copy all the functions to the target.
				$.extend(target[namespace], new Shelby.Extenders.utility.fn(target));
			}
		};
		
		Shelby.Extenders.utility.fn = Shelby.Extenders.base.fn.extend({
			reset: function() {
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
						// A property can be reset if it is an observable. Object cannot be ignore because it will 
						// prevent us from parsing their children.
						return key !== namespace && (ko.isObservable(value) || utils.isObject(value));
					},
					onFunction: action
				});
			}
		});
		
		Shelby.Extenders.utility.fn.extend = extend;

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
						onObject: action(PropertyType.Object),
						onArray: action(PropertyType.Array),
						onFunction: action(PropertyType.Scalar)
					});
				}
			},
			
			remove: function(target) {
				if (utils.isNull(target)) throw new Error("\"target\" must be an object.");
			
				var action = function(property) {
					delete property.value[namespace];
				};
			
				// Iterate on the target properties to extend all the objects and observables matching criterias.
				factory.parser().parse(target, {
					filter: function(key, value) {
						// A property can have extender to remove if it is an observable or an object.
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
		
		// Observable extenders
		// ---------------------------------
		
		ko.extenders.shelbySubscribe = function(target) {
			// When true, all the subscriptions are pause.
			var pauseAllSubscriptions = false;
			
			$.extend(target[namespace], {
				pausableSubscription: function(callback, callbackTarget /*, [event] */) {
					if (!$.isFunction(callback)) throw new Error("First argument must be a callback function.");
				
					var that = this;
					
					// Define a proxy callback that implement the pausable behaviors to replace
					// the original one.
					var proxyCallback = function(value) {
						if (!pauseAllSubscriptions && !pausableSubscription.isPause) {
							// If this observable is not paused globally or this subscription is not paused,
							// call the original callback with the original arguments.
							callback.apply(this, [value]);
						}
					};

					arguments[0] = proxyCallback;

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
			});
			
			return target;
		};

		ko.extenders.shelbyArraySubscribe = function(target) {
			$.extend(target[namespace], {
				pausableArraySubscription: function(callback /*, [callbackTarget], [event] */) {
					if (!$.isFunction(callback)) throw new Error("First argument must be a callback function.");

					// Proxy callback function adding the array changes behavior.
					arguments[0] = function(value) {
						callback.apply(this, [{ value: value }, true, "shelbyArraySubscribe"]);
					};

					// To activate the native array changes evaluation, the event must "arrayChange",
					// otherwise the standard observable subscription behavior is applied.
					arguments[2] = "arrayChange";

					// Add the subscription.
					return this.pausableSubscription.apply(this, arguments);
				}
			});
		};
		
		ko.extenders.shelbyEdit = function(target) {
			if (!$.isFunction(target[namespace].pause) || !$.isFunction(target[namespace].resume)) 
				throw new Error(utils.stringFormat("\"shelbyEditable\" can only extends an observable having \"{1}.pause\" and \"{1}.resume\" functions.", namespace));
		
			var wasPause = false;
		
			$.extend(target[namespace], {
				current: target.peek(),
				
				hasMutated: false,
				isEditing: false,
				
				beginEdit: function() {
					if (!this.isEditing) {
						this.current = target.peek();
						
						// Must keep track of the subscription "pause" status at the beginning of the edition
						// to prevent resuming the subscription at the end of the edition if it was originally pause.
						wasPause = target[namespace].isPause();
						
						if (!wasPause) {
							// Prevent the propagation of the notifications to subscribers before an
							// explicit call to "endEdit" function has been made.
							target[namespace].pause();
						}
						
						// Start edition.
						this.isEditing = true;
					}
				},
				
				endEdit: function(canNotify) {
					if (this.isEditing && this.hasMutated) {
						this.current = target.peek();
					}
					
					if (!wasPause) {
						if (this.isEditing) {
							target[namespace].resume();
							
							// When the notifications are resumed, if the observable has been edited and the mute options
							// is not specified, force a notification since the previous notifications has been "eat" because
							// the notifications were paused.
							if (this.hasMutated && canNotify !== false) {
								target.valueWillMutate();
								target.valueHasMutated();
							}
						}
					}
									
					this.isEditing = false;
					this.hasMutated = false;
				},
				
				cancelEdit: function() {
					if (this.isEditing && this.hasMutated) {
						target(this.current);
					}
					
					if (this.isEditing) {
						// Defer the "resume" to prevent synchronization problem.
						setTimeout(function() {
							target[namespace].resume();
						}, 10);
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
	})();
	
	// Shelby.Ajax
	// ---------------------------------
	
	(function() {
		var Ajax = Shelby.Ajax = function() {
		};
	
		Ajax.prototype = {
			// Send an AJAX request.
			//  - options: Any jQuery AJAX options (http://api.jquery.com/jQuery.ajax),
			//    options "url" and "type" are mandatory.
			send: function(options) {
				if (utils.isNull(options)) throw new Error("\"options\" must be a non null object literal.");
				if (utils.isNullOrEmpty(options.url)) throw new Error("\"options.url\" must be a non null or empty string.");
				if (utils.isNullOrEmpty(options.type)) throw new Error("\"options.type\" must be a non null or empty string.");
				
				var mergedOptions = $.extend({}, $.ajaxSettings, Ajax.options, options),
					hasData = utils.isObject(options.data);

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

		Ajax.options = {
			cache: false
		};
		
		// By defaults the options are the jQuery AJAX default settings (http://api.jquery.com/jQuery.ajax)
		// with a few exceptions:
		//	- Requests are made using the JSON format.
		//  - Caching is disabled.
		Ajax.options = $.extend({}, $.ajaxSettings, {
			contentType: "application/json",
			cache: false
		});
		
		Ajax.extend = extend;
	})();
	
	// Shelby.Mapper
	// ---------------------------------
	
	(function() {
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
	})();
	
	// Shelby.Factory
	//
	// Factory creating lazy singleton for Shelby dependency objects. This allow you to easily
	// modify the dependency objects prototype before Shelby instanciate and use them.
	// ---------------------------------
	
	(function() {
		Shelby.Factory = function() {
			this._propertyExtender = null;
			this._parser = null;
			this._ajax = null;
			this._mapper = null;
			this._mediator = null;
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
			},

			mediator: function() {
				if (utils.isNull(this._mediator)) {
					this._mediator = new Shelby.Mediator();
				}
				
				return this._mediator;
			}
		};
		
		Shelby.Factory.extend = extend;
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
			
			// If defined by you, it will be invoked after binding the view model with the DOM.
			_afterBind: null,
			
			// If defined by you, it will be invoked before executing a fetch AJAX request.
			//  - operationContext: See "_createOperationContext" for the object structure.
			_beforeFetch: null,
			
			// If defined by you, it will be invoked after the execution of a fetch AJAX request.
			//  - operationContext: See "_createOperationContext" for the object structure.
			_afterFetch: null,
			
			// If defined by you, it will be invoked before executing a save AJAX request.
			// ********MANQUE PARAMS
			_beforeSave: null,
			
			// If defined by you, it will be invoked after the execution of a save AJAX request.
			// ********MANQUE PARAMS
			_afterSave: null,

			_beforeRemove: null,

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
			//  - element : a DOM or jQuery element to use as the root.s
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

			_send: function(options, handlers) {
				if (utils.isNullOrEmpty(options.request.url)) throw new Error("\"options.request.url\" must be a non null or empty string.");
			
				var that = this;

				var request = $.extend({ context: this }, options.request),
					operationContext = this._createOperationContext(request);

				if ($.isFunction(handlers.onBefore)) {
					request.beforeSend = function() {
						// Prepend original arguments with the operation context.
						var args = $.makeArray(arguments);
						args.unshift(operationContext);
						
						// The original jQuery AJAX "beforeSend" function support returning "false" to abort the
						// request, allow a return value to support that behavior.
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

						// If the caller did NOT specify to NOT process the response, process the reponse. 
						if (options.response.process !== false) {
							if ($.isFunction(options.response.extractor)) {
								response = options.response.extractor.call(this, response);
							}

							if ($.isFunction(handlers.onResponse)) {
								response = handlers.onResponse.apply(that, [response, options])
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
						// Convert arguments array like to an actual array and prepend with the operation context.
						var args = $.makeArray(arguments);
						args.unshift(operationContext);

						handlers.onAfter.apply(this, args);
					});
				}
				
				return deferred.promise();
			},

			_fetch: function(options) {
				if (utils.isNull(options)) throw new Error("\"options\" must be a non null object literal.");
				if (utils.isNull(options.request)) throw new Error("\"options.request\" must be a non null object literal.");

				options.request.type = options.request.type || "GET";

				return this._send(options, {
					onBefore: this._beforeFetch,
					onAfter: this._afterFetch,
					onResponse: function(response, options) {
						// Convert the response properties to observables.
						return this._fromJS(response, options.response.mapping);
					}
				});
			},

			_save: function(options) {
				if (utils.isNull(options)) throw new Error("\"options\" must be a non null object literal.");
				if (utils.isNull(options.request)) throw new Error("\"options.request\" must be a non null object literal.");
				if (utils.isNullOrEmpty(options.request.type)) throw new Error("\"options.request.type\" must be a non nullor empty string.");

				return this._send(options, {
					onBefore: this._beforeSave,
					onAfter: this._afterSave,
					onResponse: function(response, options) {
						if (utils.isObject(options.request.data) && utils.isObject(response)) {
							factory.mapper().update(options.request.data, response);
						}

						return response;
					}
				});
			},

			_remove: function(options) {
				if (utils.isNull(options)) throw new Error("\"options\" must be a non null object literal.");
				if (utils.isNull(options.request)) throw new Error("\"options.request\" must be a non null object literal.");

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
				if (utils.isNullOrEmpty(id)) throw new Error("\"id\" must be a non null or empty string.");

				var url = this._getUrl("detail");

				var requestOptions = {
					request: {
						url: url.value,
						data: {
							id: id
						}
					},
				};

				return this._fetch($.extend(requestOptions, options));
			},

			add: function(model, options) {
				if (utils.isNull(model)) throw new Error("\"model\" must be a non null object.");

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
				var id = null,
					model = null,
					options = null,
					url = this._getUrl("update"),
					isRest = url.type === UrlType.Rest;

				if (isRest) {
					switch(arguments.length) {
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
				var url = this._getUrl("remove"),
					isRest = url.type === UrlType.Rest;

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
			
				// Iterate on the view model properties to extend all the objects and observables matching criterias.
				factory.parser().parse(this, {
					filter: function(key, value) {
						return key !== namespace && (ko.isObservable(value) || utils.isObject(value));
					},
					onObject: action,
					onArray: action
				});
				
				if ($.isFunction(this._handleDispose)) {
					this._handleDispose.call(this);
				}
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
						}
					}
					else if (utils.isObject(this._url)) {
						var url = this._url[operation];
						
						if (utils.isNullOrEmpty(url)) {
							throw new Error(utils.stringFormat("The URL for the operation \"{0}\" is not specified.", operation));
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
		
		// EXTENDERS POUR AJOUTER DES FUNCTIONS AUX OBSERVABLE ARRAY

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
	})();

	// Shelby.Mediator
	//
	// Facilitate loosely coupled inter-modules communication.
	// ---------------------------------

	(function() {
		Shelby.Mediator = function() {
			this._mediator = new ko.subscribable();
		};
		
		Shelby.Mediator.prototype = {
			subscribe: function(channel, callback, context) {
				if (!$.isFunction(callback)) throw new Error("\"callback\" must be a function.");

				var subscription = null;

				if (utils.isNullOrEmpty(channel)) {
					subscription = this._mediator.subscribe(callback, context);
				}
				else {
					subscription = this._mediator.subscribe(callback, context, channel);
				}

				return {
					channel: channel,
					unsuscribe: function() {
						subscription.dispose();
					}
				}
			},

			publish: function(channel, value) {
				if (utils.isNullOrEmpty(channel)) {
					this._mediator.notifySubscribers(value);
				}
				else {
					this._mediator.notifySubscribers(value, channel);
				}
			}
		};

		Shelby.Mediator.subscribe = function() {
			var instance = factory.mediator();

			return instance.subscribe.apply(instance, arguments);
		};

		Shelby.Mediator.publish = function() {
			var instance = factory.mediator();

			instance.publish.apply(instance, arguments);
		};
	})();
	
	return Shelby;
}));