/// <summary>Determines the area of a circle that has the specified radius parameter.</summary>
/// <param name="radius" type="Number">The radius of the circle.</param>
/// <returns type="Number">The area.</returns>
/// <field name='HorsePower' type='Number'>The engine's horsepower.</field>

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
			if (!this.isObject(obj)) {
				return false;
			}
			
			if (properties.length === 0) {
				return false;
			}
		
			for (var i = 0, max = properties.length; i < max; i += 1) {
				if (!this.hasOwnProperty(obj, properties[i])) {
					return false;
				}
			}
			
			return true;
		},
		
		isPartiallyImplementing: function(obj, properties) {
			if (!this.isObject(obj)) {
				return false;
			}
		
			for (var i = 0, max = properties.length; i < max; i += 1) {
				if (this.hasOwnProperty(obj, properties[i])) {
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
		
		// copyProperties: function(target, properties) {
			// if (!this.isNull(properties)) {
				// $.each(properties, function(propertyKey, property) {
					// target[propertyKey] = property;
				// });
			// }
		// },
		
		// // Union multiple arrays in an unordered way.
		// arrayUnion: function() {
			// var firstArray = arguments[0],
				// result = firstArray.slice(0);
				
			// for (var i = 1, argumentLength = arguments.length; i < argumentLength; i += 1) {
				// var currentArray = arguments[i];
			
				// for (var j = 0, arrayLength = currentArray.length; j < arrayLength; j += 1) {
					// if (this.arrayIndexOf(firstArray, currentArray[j]) === -1) {
						// result.push(currentArray[j]);
					// }
				// }
			// }
			
			// return result;
		// }
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
	
	Shelby.ObjectParser = function() {
		this._current = null;
		this._options = null;
		this._context = null;
	};
	
	Shelby.ObjectParser.prototype = {
		process: function(obj, options, context) {
			this._reset(obj, options, context);
			this._next("", obj, "");
		},
		
		_reset: function(obj, options, context) {
			this._current = obj;
			this._options = this._computeOptions(options, true);
			this._context = context;
		},
		
		_computeOptions: function(options, clone) {
			if (!utils.isObject(options)) {
				options = {};
			}
			else {
				if (clone) {
					options = utils.clonePlainObject(options);
				}
			}
			
			options.ignore = this._computeIgnorePaths(options.ignore);

			return options;
		},
		
		_computeIgnorePaths: function(ignorePaths) {
			if ($.isArray(ignorePaths)) {
				return utils.arrayMap(ignorePaths, function(ignorePath, index) {
					if (utils.isString(ignorePath)) {
						// If this is a wildcard path, create a function that use a regular expression to match the current path against the ignore pattern,
						// otherwise create a function that use the equality operator to match the current path against the ignore path.
						if (ignorePath.indexOf("*") !== -1) {
							// Transform the wildcard caracter '*' into regex expression [^]*
							var pattern = new RegExp(ignorePath.replace(/\*/g, "[^]+"));
						
							return function(currentPath) {
								return pattern.test(currentPath);
							};
						}
						
						return function(currentPath) {
							return ignorePath === currentPath;
						};
					}
						
					if (!$.isFunction(ignorePath)) {
						throw new Error(utils.stringFormat("Ignore path {0} must be a string.", index));
					}
					
					return ignorePath;
				});
			}
			
			return [];
		},
		
		_next: function(key, value, path) {
			var augmentedPath = this._augmentPath(path, key);
			
			if (!this._isIgnorePath(augmentedPath)) {
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
			for (var propertyKey in obj) {
				if (utils.hasOwnProperty(obj, propertyKey)) {
					this._next(propertyKey, obj[propertyKey], path);
				}
			}
			
			this._atomic(key, obj, path, this._options.onObject);
		},
		
		_array: function(key, array, path) {
			for (var i = 0, max = array.length; i < max; i += 1) {
				this._next(i, array[i], path);
			}
			
			this._atomic(key, array, path, this._options.onArray);
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
		
		_isIgnorePath: function(path) {
			if (utils.arrayIndexOf(this._options.ignore, path, this._ignorePathComparer) !== -1) {
				return true;
			}
			
			return false;
		},
		
		_ignorePathComparer: function(evaluator, currentPath) {
			return evaluator(currentPath);
		},
		
		_isArray: function(value) {
			return $.isArray(value);
		},
		
		_augmentPath: function(actualPath, newPart) {
			if (actualPath === "/") {
				return actualPath + newPart;
			}
			
			return actualPath + "/" + newPart;
		}
	};
	
	Shelby.ObjectParser.extend = extend;
	
	// Shelby.ObjectModifier
	// ---------------------------------
	
	Shelby.ObjectModifier = Shelby.ObjectParser.extend({
		_initialize: function() {
			this._target = null;
		},
	
		process: function(obj, options, target, context) {
			this._reset(obj, options, target, context);
			
			return this._next("", obj, "", {});
		},
		
		_reset: function(obj, options, target, context) {
			this._target = target;
			
			Shelby.ObjectParser.prototype._reset.apply(this, [obj, options, context]);
		},
		
		_next: function(key, value, path, options) {
			var augmentedPath = this._augmentPath(path, key);
			
			if (this._isIgnorePath(augmentedPath)) {
				return value;
			}
			else {
				if (this._isArray(value)) {
					return this._array(key, value, augmentedPath, options);
				}
				else if (utils.isObject(value)) {
					return this._object(key, value, augmentedPath, options);
				}
				else if ($.isFunction(value)) {
					return this._atomic(key, value, augmentedPath, options, this._options.onFunction);
				}
				else {
					return this._atomic(key, value, augmentedPath, options, this._options.onAtomic);
				}
			}
		},
		
		_object: function(key, obj, path, options) {
			var modifiedObject = this._isRoot(path) ? this._target || {} : {};
		
			for (var propertyKey in obj) {
				if (utils.hasOwnProperty(obj, propertyKey)) {
					var modifiedValue = this._next(propertyKey, obj[propertyKey], path, options);
					
					if (modifiedValue !== Shelby.ObjectModifier.REMOVE_FLAG) {
						modifiedObject[propertyKey] = modifiedValue;
					}
				}
			}
			
			return this._atomic(key, modifiedObject, path, options, this._options.onObject);
		},
		
		_array: function(key, array, path, options) {
			var modifiedArray = [];
			
			for (var i = 0, max = array.length; i < max; i += 1) {
				var modifiedValue = this._next(i, array[i], path, options);
				
				if (modifiedValue !== Shelby.ObjectModifier.REMOVE_FLAG) {
					modifiedArray.push(modifiedValue);
				}
			}
			
			return this._atomic(key, modifiedArray, path, options, this._options.onArray);
		},
		
		_atomic: function(key, value, path, options, handler) {
			if ($.isFunction(handler)) {
				var args = {
					key: key,
					value: value,
					path: path,
					options: options
				}
				
				return handler.apply(this._context, [args]);
			}
			
			return value;
		},
		
		_isRoot: function(path) {
			return path === "/";
		}
	});
	
	Shelby.ObjectModifier.REMOVE_FLAG = "__shelby_remove__";
	
	// Shelby.ObjectMapper
	// ---------------------------------
	
	Shelby.ObjectMapper = Shelby.ObjectModifier.extend({
		process: function(obj, options, target) {
			var mappedObject = Shelby.ObjectModifier.prototype.process.apply(this, [obj, options, target, this]);
			
			// There is no need to clone the ignore option here since a new array will be
			// created everytime a mapping is requested.
			mappedObject[Shelby.ObjectMapper.OPTIONS_PROPERTY] = {
				ignore: this._options.ignore,
				mapObject: this._options.mapObject,
				mapObservable: this._options.mapObservable,
				mapArray: this._options.mapArray,
				mapAtomic: this._options.mapAtomic,
				afterMapArray: this._options.afterMapArray,
				afterMapObservable: this._options.afterMapObservable,
				afterMapAtomic: this._options.afterMapAtomic,
				unmap: this._options.unmap
			};
			
			return mappedObject;
		},
	
		_computeOptions: function(options) {
			if (!utils.isObject(options)) {
				options = {};
			}
			else {
				options = utils.clonePlainObject(options);
			}
			
			options.onObject = this._mapObject;
			options.onFunction = this._mapFunction;
			options.onArray = this._mapArray;
			options.onAtomic = this._mapAtomic;
			
			return Shelby.ObjectModifier.prototype._computeOptions.apply(this, [options]);
		},
		
		_mapObject: function(args) {
			return this._mapValue(args, this._options.mapObject, null, function(value) {
				return value;
			});
		},
		
		_mapFunction: function(args) {
			if (ko.isObservable(args.value)) {
				return this._mapValue(args, this._options.mapObservable, this._options.afterMapObservable, function(value) {
					return value;
				});
			}
			
			return Shelby.ObjectModifier.REMOVE_FLAG;
		},
		
		_mapArray: function(args) {
			return this._mapValue(args, this._options.mapArray, this._options.afterMapArray, function(value) {
				return ko.observableArray(value);
			});
		},
		
		_mapAtomic: function(args) {
			return this._mapValue(args, this._options.mapAtomic, this._options.afterMapAtomic, function(value) {
				return ko.observable(value);
			});
		},
		
		_mapValue: function(args, mapHandler, afterMapHandler, mapper) {
			var mappedValue = null,
				canFlagType = true;
		
			if ($.isFunction(mapHandler)) {
				// When a map handler is specified this is your responsability to handle the mapping
				// if you dont change the "skip" flag to false.
				args.skip = true;
				
				mappedValue = mapHandler.apply(null, [args]);
				
				if (!args.skip) {
					mappedValue = mapper(args.value);
				}
				else {
					// When this is the user who take cares of the mapping, we must validate if the
					// mapped value type can accept a new property (the mapping flag).
					canFlagType = $.isFunction(mappedValue) || utils.isObject(mappedValue);
				}
			}
			else {
				mappedValue = mapper(args.value);
			}
			
			// If the mapped value of the property is not the REMOVE FLAG and the value type is flaggable,
			// flag the property as mapped.
			if (mappedValue !== Shelby.ObjectModifier.REMOVE_FLAG && canFlagType) {
				mappedValue[Shelby.ObjectMapper.MAPPING_PROPERTY] = true;
				
				// The after map handler is called only when the property can be flag as mapped.
				if ($.isFunction(afterMapHandler)) {
					args.value = mappedValue;
					
					// The return value can be ignored since this handler is available to add 
					// extensions to observables which can be applied directly to the observable function reference.
					afterMapHandler.apply(null, [args]);
				}
			}
			
			return mappedValue;
		}
	});
	
	Shelby.ObjectMapper.MAPPING_PROPERTY = "__shelby_mapping__";
	Shelby.ObjectMapper.OPTIONS_PROPERTY = "__shelby_mapping_options__";
	
	// Determine if a value has been map by Shelby object mapper.
	Shelby.ObjectMapper.isMap = function(value) {
		return !utils.isNull(value) && value[Shelby.ObjectMapper.MAPPING_PROPERTY] === true;
	};
	
	// Shelby.ObjectUnmapper
	// ---------------------------------
	
	Shelby.ObjectUnmapper = Shelby.ObjectModifier.extend({
		process: function(obj) {
			if (!Shelby.ObjectMapper.isMap(obj)) throw new Error("Object is not mapped.");
		
			var options = obj[Shelby.ObjectMapper.OPTIONS_PROPERTY],
				unmappedObject = Shelby.ObjectModifier.prototype.process.apply(this, [obj, options, null, this]);
			
			// Not needed on an unmapped object.
			delete unmappedObject[Shelby.ObjectMapper.OPTIONS_PROPERTY];
			
			return unmappedObject;
		},
	
		_computeOptions: function(options) {
			options = utils.clonePlainObject(options);
			
			options.onObject = this._unmapObject;
			options.onFunction = this._unmapFunction;
			options.onArray = null;
			options.onAtomic = this._unmapAtomic;
		
			return options;
		},
		
		_object: function(key, obj, path, options) {
			if (options.ignoreMappingFlag !== true && !Shelby.ObjectMapper.isMap(obj)) {
				return Shelby.ObjectModifier.REMOVE_FLAG;
			}
			
			return Shelby.ObjectModifier.prototype._object.apply(this, [key, obj, path, options]);
		},
		
		_array: function(key, array, path, options) {
			var unmappedArray = Shelby.ObjectModifier.REMOVE_FLAG;
			
			if (options.ignoreMappingFlag === true || (Shelby.ObjectMapper.isMap(array) && ko.isObservable(array))) {
				var unwrappedArray = array.peek();
				
				unmappedArray = [];
			
				for (var i = 0, max = unwrappedArray.length; i < max; i += 1) {
					// Because the array is mapped, all is items are considered mapped, otherwise the items added
					// after the mapping process will always be ignored when unmapping.
					options.ignoreMappingFlag = true;
				
					var unmappedValue = this._next(i, unwrappedArray[i], path, options);
					
					// Turn off the flag when the array items are unmapped.
					options.ignoreMappingFlag = false;
					
					if (unmappedValue !== Shelby.ObjectModifier.REMOVE_FLAG) {
						unmappedArray.push(unmappedValue);
					}
				}
			}

			return unmappedArray;
		},
		
		_unmapObject: function(args) {
			return args.value;
		},
		
		_unmapFunction: function(args) {
			if (args.options.ignoreMappingFlag === true || Shelby.ObjectMapper.isMap(args.value)) {
				// This is an observable because it is flag as mapped, so it can be unmap safely.
				return this._unmapObservable(args, this._options.unmap);
			}
			
			return Shelby.ObjectModifier.REMOVE_FLAG;
		},
		
		_unmapAtomic: function(args) {
			return Shelby.ObjectModifier.REMOVE_FLAG;
		},
		
		_unmapObservable: function(args, handler) {
			var unmappedValue = null;
			
			if ($.isFunction(handler)) {
				// When an handler is specified this is your responsability to handle the mapping
				// if you dont change the "skip" flag to false.
				args.skip = true;
				
				unmappedValue = handler.apply(null, [args]); 
				
				if (!args.skip) {
					unmappedValue = ko.utils.peekObservable(args.value);
				}
			}
			else {
				unmappedValue = ko.utils.peekObservable(args.value);
			}
			
			return unmappedValue;
		},
		
		_isArray: function(value) {
			value = ko.utils.peekObservable(value);
		
			return $.isArray(value);
		}
	});
	
	// Shelby.MappedObjectParser
	// ---------------------------------
	
	Shelby.MappedObjectParser = Shelby.ObjectParser.extend({
		_next: function(key, value, path) {
			if (Shelby.ObjectMapper.isMap(value)) {
				Shelby.ObjectParser.prototype._next.apply(this, arguments);
			}
		},
	
		_array: function(key, array, path) {
			var unwrappedArray = array.peek();
		
			for (var i = 0, max = unwrappedArray.length; i < max; i += 1) {
				this._next(i, unwrappedArray[i], path);
			}
			
			this._atomic(key, array, path, this._options.onArray);
		},
	
		_isArray: function(value) {
			value = ko.utils.peekObservable(value);
		
			return $.isArray(value);
		}
	});
	
	// Shelby.Mapper
	// ---------------------------------
	
	Shelby.Mapper = function() {
	};
	
	Shelby.Mapper.prototype = {
		stringify: function(obj) {
			var unmappedObject = this.toJS(obj);
			
			return ko.utils.stringifyJson(unmappedObject);
		},
		
		toJS: function(obj) {
			if (utils.isNull(obj)) throw new Error("\"obj\" must be non-null.");
				
			return factory.objectUnmapper().process(obj);
		},
		
		fromJS: function(obj, options, target) {
			if (utils.isNull(obj)) throw new Error("\"obj\" must be non-null.");
			if (!utils.isNull(target) && !utils.isObject(target)) throw new Error("\"target\" must be a non-null literal or prototyped object.");
				
			return factory.objectMapper().process(obj, options, target);
		}
	};
	
	// Added to Shelby.Mapper for convenience.
	Shelby.Mapper.REMOVE = Shelby.ObjectModifier.REMOVE_FLAG;
	
	// Shelby.Ajax
	// ---------------------------------
	
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
	
	// Available AJAX methods.
	Shelby.Ajax.Methods = {
		Get: "GET",
		Post: "POST",
		Put: "PUT",
		Delete: "DELETE"
	};

    // Define a unique method for every AJAX methods.
    $.each(Shelby.Ajax.Methods, function(method, httpVerb) {
        Shelby.Ajax.prototype[method.toLowerCase()] = function(options) {
            options.type = httpVerb;
			
            return this.send(options);
        };
    });
	
	// Shelby.Factory
	//
	// Lazy singleton factories for Shelby satellite objects. This allow you to easily
	// modify the satellite objects prototype before Shelby use them.
	// ---------------------------------
	
	Shelby.Factory = function() {
		this._objectParser = null;
		this._objectMapper = null;
		this._objectUnmapper = null;
		this._mappedObjectParser = null;
		this._mapper = null;
		this._ajax = null;
	};
	
	Shelby.Factory.prototype = {
		objectParser: function() {
			if (utils.isNull(this._objectParser)) {
				this._objectParser = new Shelby.ObjectParser();
			}
			
			return this._objectParser;
		},
	
		objectMapper: function() {
			if (utils.isNull(this._objectMapper)) {
				this._objectMapper = new Shelby.ObjectMapper();
			}
			
			return this._objectMapper;
		},
		
		objectUnmapper: function() {
			if (utils.isNull(this._objectUnmapper)) {
				this._objectUnmapper = new Shelby.ObjectUnmapper();
			}
			
			return this._objectUnmapper;
		},
		
		mappedObjectParser: function() {
			if (utils.isNull(this._mappedObjectParser)) {
				this._mappedObjectParser = new Shelby.MappedObjectParser();
			}
			
			return this._mappedObjectParser;
		},
		
		mapper: function() {
			if (utils.isNull(this._mapper)) {
				this._mapper = new Shelby.Mapper();
			}
			
			return this._mapper;
		},
		
		ajax: function() {
			if (utils.isNull(this._ajax)) {
				this._ajax = new Shelby.Ajax();
			}
			
			return this._ajax;
		}
	}
	
	var factory = new Shelby.Factory();
	
	// Shelby.Model
	// ---------------------------------
	
	// data: The model data. Can be an object literal or a JSON string.
	// mappingOptions: The options for mapping the data to knockout observables as an object literal.
	// 	- ignore: An array of property paths to ignore, each properties must be identified by:
    //	   - A full path starting with the character '/'. Ex. ["/prop1", "/prop1/array/2/prop2"].
	//     - A wilcard path starting with the character '/'. Ex. ["/prop1/array/*/prop2", "/prop1/array1/*/array2/*/prop2"].
	// 	- mapObject: A function called everytime an object property is map.
	// 	- mapObservable: A function called everytime a computed observable property is map.
	// 	- mapArray: A function called everytime an array property is map.
	// 	- mapAtomic: A function called everytime an atomic property is map.
	// 	- afterMapArray: A function called everytime an array property has been map.
	// 	- afterMapObservable: A function called everytime a computed observable property has been map.
	// 	- afterMapAtomic: A function called evertyime an atomic property has been map.
	// 	- unmap: A function called everytime a property is unmap.
	Shelby.Model = function(data, mappingOptions) {
		// Extenders applyed to all the observables.
		this._commonExtenders = [{ name: "shelbyPausableObservable", options: true }];
		this._arrayExtenders = [{ name: "shelbyArrayObservable", options: true }];
	
		// if (!utils.isNull(options)) {
			// if (utils.isObject(options.extenders)) {
				// if ($.isArray(options.extenders.common)) {
					// var extenders = options.extenders.common;
				
					// $.each(extenders, function() {
						// if (!utils.isImplementing(this, ["name", "options"])) {
							// throw new Error("An extender must be an object literal having a \"name\" and \"options\" properties.");
						// }
					// });
				
					// this._commonExtenders = this._commonExtenders.concat(extenders);
				// }
			// }
		// }
	
		// Current subscriptions informations.
		// The array contains objects having the following definition:
		// 	- id : the subscriptions as a unique identifier.
		//	- propertySubscriptions: an	array having the subscriptions data for each properties of the subscriptions.
		//  - isPause: true if the subscription is paused, false otherwise.
		this._subscriptions = [];
	
		this._mapData(data, this._computeMappingOptions(mappingOptions));
	};
	
	Shelby.Model.prototype = {
		// Proxy constructor function that should be override by you. 
		// If defined, it will be invoked when the model is created after all the 
		// initialization logic is done.
		_initialize: null,
		
		// _computeOptions: function(options) {
		// },
		
		// _computeExtenders: function(extenders) {
		// },
			
		// _validateExtenders: function() {
		// },
		
		_computeMappingOptions: function(mappingOptions) {
			if (!utils.isObject(mappingOptions)) {
				mappingOptions = {};
			}
			else {
				mappingOptions = utils.clonePlainObject(mappingOptions);
			}
		
			return this._computeAfterMapHandlers(mappingOptions);
		},
		
		_computeAfterMapHandlers: function(mappingOptions) {
			if (!$.isArray(this._commonExtenders) || !$.isArray(this._arrayExtenders)) throw new Error("Common and array extenders must be non-null arrays.");
		
			var afterMapHandlers = [
				{ name: "afterMapArray", extenders: this._commonExtenders.concat(this._arrayExtenders), old: mappingOptions.afterMapArray },
				{ name: "afterMapObservable", extenders: this._commonExtenders, old: mappingOptions.afterMapObservable },
				{ name: "afterMapAtomic", extenders: this._commonExtenders, old: mappingOptions.afterMapAtomic }
			];
			
			$.each(afterMapHandlers, function() {
				var handler = this;
				
				// Ensure that all the extenders have the right structure.
				if ($.isArray(handler.extenders)) {
					$.each(handler.extenders, function() {
						if (!utils.isImplementing(this, ["name", "options"])) {
							throw new Error("An extender must be an object literal having a \"name\" and \"options\" properties.");
						}
					});
				}
			
				mappingOptions[handler.name] = function(args) {
					if (ko.isObservable(args.value)) {
						args.value.extend(utils.arrayMapToObject(handler.extenders, "name", "options"));
					}
				
					if ($.isFunction(handler.old)) {
						handler.old.apply(null, [args]);
					}
				};
			});
			
			return mappingOptions;
		},
		
		_mapData: function(data, options) {
			if (utils.isString(data)) {
				this._fromJSON(data, options);
			}
			else if (utils.isObject(data)) {
				this._fromJS(data, options);
			}
			else {
				throw new Error("A Shelby.Model must be instanciated with a non-null literal or prototyped object or JSON data.");
			}
		},
		
		// Strips everything that is not a data properties mapped during the model instanciation
		// and transform observables back to a raw JSON string.
		stringify: function() {
			return factory.mapper().stringify(this);
		},
		
		// Transform a JSON string properties into observables and add them to the model.
		// Options are the same as the Shelby.Model constructor "mappingOptions".
		_fromJSON: function(dataAsJson, options) {
			var data = ko.utils.parseJson(dataAsJson);
			
			if (!utils.isObject(data)) {
				throw new Error("A Shelby.Model cannot be instanciated with JSON data that do not represent an object literal.");
			}
			
			this._fromJS(data, options);
		},
		
		// Strips everything that is not a data properties mapped during the model instanciation
		// and transform observables back to a raw JavaScript object.
		toJS: function() {
			return factory.mapper().toJS(this);
		},
		
		// Transform an object properties into observables and add them to the model.
		// Options are the same as the Shelby.Model constructor "mappingOptions".
		_fromJS: function(data, options) {
			factory.mapper().fromJS(data, options, this);
		},
		
		// *********** PLUS VALIDE ***********
		
		// Add a subscription to one or multiples properties of the model with the ability to pause / resume the subscription.
		// The subscription will be notified when any of the properties is updated.
		//  - propertyFilters: Can be:
		//     - null / undefined to suscribe to all the properties.
		//     - An array of property paths to subscribe to.
		//     - An object literal having either a property called "include" or a property called "exclude".
		//       The "include" properties contains the paths of the properties to include.
		//       The "exclude" properties contains the paths of the properties to exclude.
		// 	   - *** The property path must always start with the character '/'. ***
		//  - options: An object literal having the following structure:
		//     - callbackTarget: An object pass to the callback.
		//     - event: An event name to subscribe to. Ex. "beforeChange", "afterChange".
		//  - callback: A function called whenever any of the subscription properties is updated. The callback context is the 
		//    property subscription information or the "callbackTarget" if specified, the parameters are:
		//     - newValue: The updated value.
		//     - propertyPath: The path of the property whose value is updated.
		//
		// Examples:
		//  - model.subscribe(function(){});
		//  - model.subscribe({ callbackTarget: myTarget, event: "beforeChange" }, function(){});
		//  - model.subscribe(["/prop1", "prop2", "prop3"], function(){});
		//  - model.subscribe({ include: ["/prop/*"] }, { callbackTarget: myTarget, event: "beforeChange" }, function(){});
		//  - model.subscribe({ include: ["/prop/1"] }, { callbackTarget: myTarget, event: "beforeChange" }, function(){});
		//  - model.subscribe({ exclude: ["/prop/*/nestedProp/*/prop"] }, { callbackTarget: myTarget, event: "beforeChange" }, function(){});
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
			var args = null,
				isOptions = this._isSubscriptionOptions(propertyFiltersOrOptions);
		
			if (utils.isNull(propertyFiltersOrOptions) || !isOptions) {
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
			return utils.isPartiallyImplementing(value, ["callbackTarget", "event", "subscriber"]);
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

			// Evaluator that handles the "include specific property" behavior by evaluating the property path against 
			// the "property to includes"
			var canSubscribeToProperty = null;
			
			if ($.isArray(include)) {
				include = this._computeIncludePaths(include);
				
				canSubscribeToProperty = function(path) {
					var comparer = function(evaluator, currentPath) {
						return evaluator(currentPath);
					};
					
					return utils.arrayIndexOf(include, path, comparer) !== -1;
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
			
			var subscriber = $.isFunction(options.subscriber) ? options.subscriber : this._propertySubscriber;
		
			var action = function(property) {
				if (canSubscribeToProperty(property.path)) {
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
				}
			};
			
			// Iterate on the object properties and add the subscriptions to all the mapped properties 
			// matching the filters.
			factory.mappedObjectParser().process(this, {
				onArray: action,
				onFunction: action,
				ignore: exclude
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
		
		_computeIncludePaths: function(includePaths) {
			return utils.arrayMap(includePaths, function(includePath) {
				if (utils.isString(includePath)) {
					// If this is a wildcard path, create a function that use a regular expression to match the current path against the include pattern,
					// otherwise create a function that use the equality operator to match the current path against the include path.
					if (includePath.indexOf("*") !== -1) {
						// Transform the wildcard caracter '*' into regex expression [^]*
						var pattern = new RegExp(includePath.replace(/\*/g, "[^]*"));
					
						return function(currentPath) {
							return pattern.test(currentPath);
						};
					}
					
					return function(currentPath) {
						return includePath === currentPath;
					};
				}
				
				throw new Error(utils.stringFormat("Include path {1} must be a string.", index));
			});
		},
		
		_propertySubscriber: function(property, subscription) {
			return property.value.pausableSubscription(subscription.id, subscription.callback, subscription.callbackTarget, subscription.event);
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
		},
		
		applyExtenders: function(commonExtenders, arrayExtenders) {
			if (utils.isNull(commonExtenders)) {
				commonExtenders = [];
			}
			else if (!$.isArray(commonExtenders)) {
				commonExtenders = [commonExtenders];
			}
			
			if (utils.isNull(arrayExtenders)) {
				arrayExtenders = [];
			}
				
			// Ensure that all the extenders have the right structure.
			$.each(commonExtenders.concat(arrayExtenders), function() {
				if (!utils.isImplementing(this, ["name", "options"])) {
					throw new Error("An extender must be an object literal having a \"name\" and \"options\" properties.");
				}
			});
			
			var action = function(extenders) {
				return function(property) {
					property.value.extend(extenders);
				}
			};
			
			var options = {
				onArray: commonExtenders.length > 0 || arrayExtenders.length > 0 ? action(utils.arrayMapToObject(commonExtenders.concat(arrayExtenders), "name", "options")) : null,
				onFunction: commonExtenders.length > 0 ? action(utils.arrayMapToObject(commonExtenders, "name", "options")) : null
			};
			
			// Deeply traverse the model and apply the extenders to all the mapped properties.
			factory.mappedObjectParser().process(this, options);
			
			// Will add an extenders to the array if its not already a part of it.
			var addToArray = function(array, extenders) {
				$.each(extenders, function() {
					var index = utils.arrayIndexOf(array, this, function(actual, extender) {
						return actual.name === extender.name;
					});
				
					if (index === -1) {
						array.push(this);
					}
				});
			};
			
			addToArray(this._commonExtenders, commonExtenders);
			addToArray(this._arrayExtenders, arrayExtenders);
		},
		
		// Return a new model with identical properties and functions.
		clone: function() {
			// Clone the model to copy all the Shelby.Model properties and maybe some properties added by extending the model.
			var clone = utils.clonePlainObject(this);
			
			// Save the mapping options before deleting the mapping footprint, they will be use to map the data on the clone.
			var mappingOptions = utils.clonePlainObject(this[Shelby.ObjectMapper.OPTIONS_PROPERTY]);
			
			// Stringifyng the observables ensure that they are copied without theirs states / subscriptions.
			var dataAsJson = this.stringify();
				
			// Remove the mapping footprint.
			delete clone[Shelby.ObjectMapper.MAPPING_PROPERTY];
			delete clone[Shelby.ObjectMapper.OPTIONS_PROPERTY];
			
			// Map the JSON data with the original mapping options. 
			clone._fromJSON(dataAsJson, mappingOptions);
			
			// Subscriptions are not cloned, this would lead to akward behvaviors.
			clone._subscriptions = [];
			
			return clone;
		},
		
		// Return a clone of the model having only the data properties as observables.
		unwrap: function() {
			var unwrapped = utils.clonePlainObject(this),
				propertiesToRemove = [Shelby.ObjectMapper.MAPPING_PROPERTY, Shelby.ObjectMapper.OPTIONS_PROPERTY, "_subscriptions", "_commonExtenders", "_arrayExtenders"];
			
			$.each(utils.objectKeys(Shelby.Model.prototype).concat(propertiesToRemove), function(propertyKey) {
				delete unwrapped[this];
			});
			
			return unwrapped;
		},
		
		// Determine if this model implements the specified properties.
		isImplementing: function(properties) {
			if (!$.isArray(properties)) throw new Error("\"properties\" must be a non-null array.");
		
			return utils.isImplementing(this, properties);
		},
		
		// Determine if the data properties of both models are equivalent.
		equals: function(model) {
		}
	};
	
	Shelby.Model.extend = extend;
	
	// Shelby.ArrayModel
	// ---------------------------------
	
	Shelby.ArrayModel = function(data, mappingOptions) {
		// The underlying observable array.
		this.inner = null;
		
		// Extenders applyed to all the observables.
		this._commonExtenders = [{ name: "shelbyPausableObservable", options: true }];
		this._arrayExtenders = [{ name: "shelbyArrayObservable", options: true }];
		
		// Current subscriptions informations.
		// The array contains objects having the following definition:
		// 	- id : the subscriptions as a unique identifier.
		//	- propertySubscriptions: an	array having the subscriptions data for each properties of the subscriptions.
		//  - isPause: true if the subscription is paused, false otherwise.
		this._subscriptions = [];
		
		this._mapData(data, this._computeMappingOptions(mappingOptions));
	};
	
	Shelby.ArrayModel.prototype = {
		_mapData: function(data, options) {
			if (utils.isString(data)) {
				this._fromJSON(data, options);
			}
			else if ($.isArray(data)) {
				this._fromJS(data, options);
			}
			else {
				throw new Error("A Shelby.ArrayModel can be instanciated with wether a non-null array or JSON data representing an array.");
			}
		},
		
		_computeMappingOptions: function(mappingOptions) {
			if (!utils.isObject(mappingOptions)) {
				mappingOptions = {};
			}
			else {
				mappingOptions = utils.clonePlainObject(mappingOptions);
			}
		
			return this._computeAfterMapHandlers(mappingOptions);
		},
		
		_computeAfterMapHandlers: function(mappingOptions) {
			if (!$.isArray(this._commonExtenders) || !$.isArray(this._arrayExtenders)) throw new Error("Common and array extenders must be non-null arrays.");
		
			var afterMapHandlers = [
				{ name: "afterMapArray", extenders: this._commonExtenders.concat(this._arrayExtenders), old: mappingOptions.afterMapArray },
				{ name: "afterMapObservable", extenders: this._commonExtenders, old: mappingOptions.afterMapObservable },
				{ name: "afterMapAtomic", extenders: this._commonExtenders, old: mappingOptions.afterMapAtomic }
			];
			
			$.each(afterMapHandlers, function() {
				var handler = this;
				
				// Ensure that all the extenders have the right structure.
				if ($.isArray(handler.extenders)) {
					$.each(handler.extenders, function() {
						if (!utils.isImplementing(this, ["name", "options"])) {
							throw new Error("An extender must be an object literal having a \"name\" and \"options\" properties.");
						}
					});
				}
			
				mappingOptions[handler.name] = function(args) {
					if (ko.isObservable(args.value)) {
						args.value.extend(utils.arrayMapToObject(handler.extenders, "name", "options"));
					}
				
					if ($.isFunction(handler.old)) {
						handler.old.apply(null, [args]);
					}
				};
			});
			
			return mappingOptions;
		},
		
		// Strips everything that is not a data properties mapped during the array model instanciation
		// and transform observables back to a raw JSON string.
		stringify: function() {
			return factory.mapper().stringify(this.inner);
		},
		
		// Transform a JSON string properties into observables and add them to the array model.
		// Options are the same as the Shelby.ArrayModel constructor "mappingOptions".
		_fromJSON: function(dataAsJson, options) {
			var data = ko.utils.parseJson(dataAsJson);
			
			if (!$.isArray(data)) {
				throw new Error("A Shelby.ArrayModel cannot be instanciated with JSON data that do not represent a non null array.");
			}
			
			this._fromJS(data, options);
		},
		
		// Strips everything that is not a data properties mapped during the array model instanciation
		// and transform observables back to a raw JavaScript array.
		toJS: function() {
			return factory.mapper().toJS(this.inner);
		},
		
		// Transform an object properties into observables and add them to the array model.
		// Options are the same as the Shelby.ArrayModel constructor "mappingOptions".
		_fromJS: function(data, options) {
			this.inner = factory.mapper().fromJS(data, options);
		},
		
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
			
			throw new Error("You must provide at least a callback.");
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
			var args = null,
				isOptions = this._isSubscriptionOptions(propertyFiltersOrOptions);
		
			if (utils.isNull(propertyFiltersOrOptions) || !isOptions) {
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
			return utils.isPartiallyImplementing(value, ["callbackTarget", "event", "subscriber"]);
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
				else if (propertyFilters.excludeChildren === true) {
					// Convenient syntax to subscribe only to the array itself.
					args = [["/"], null];
				}
			}

			if (utils.isNull(args)) {
				throw new Error("Property filters type is not supported.");
			}
			
			return args;
		},
		
		_addSubscription: function(include, exclude, options, callback) {
			var that = this;
		
			// Evaluator that handles the "include specific property" behavior by evaluating the property path against 
			// the "property to includes"
			var canSubscribeToProperty = null;
			
			if ($.isArray(include)) {
				include = this._computeIncludePaths(include);
				
				canSubscribeToProperty = function(path) {
					var comparer = function(evaluator, currentPath) {
						return evaluator(currentPath);
					};
					
					return utils.arrayIndexOf(include, path, comparer) !== -1;
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
			
			var subscriber = $.isFunction(options.subscriber) ? options.subscriber : this._propertySubscriber;
		
			var action = function(property) {
				if (canSubscribeToProperty(property.path)) {
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
				}
			};
			
			// Deeply traverse the underlying observable array and subscribe to all the mapped properties 
			// matching the filters.
			factory.mappedObjectParser().process(this.inner, {
				onArray: action,
				onFunction: action,
				ignore: exclude
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
		
		_computeIncludePaths: function(includePaths) {
			return utils.arrayMap(includePaths, function(includePath) {
				if (utils.isString(includePath)) {
					// If this is a wildcard path, create a function that use a regular expression to match the current path against the include pattern,
					// otherwise create a function that use the equality operator to match the current path against the include path.
					if (includePath.indexOf("*") !== -1) {
						// Transform the wildcard caracter '*' into regex expression [^ ]*
						var pattern = new RegExp(includePath.replace(/\*/g, "[^ ]*"));
					
						return function(currentPath) {
							return pattern.test(currentPath);
						};
					}
					
					return function(currentPath) {
						return includePath === currentPath;
					};
				}
				
				throw new Error(utils.stringFormat("Include path {1} must be a string.", index));
			});
		},
		
		_propertySubscriber: function(property, subscription) {
			return property.value.pausableSubscription(subscription.id, subscription.callback, subscription.callbackTarget, subscription.event);
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
		
		applyExtenders: function(commonExtenders, arrayExtenders) {
			if (utils.isNull(commonExtenders)) {
				commonExtenders = [];
			}
			else if (!$.isArray(commonExtenders)) {
				commonExtenders = [commonExtenders];
			}
			
			if (utils.isNull(arrayExtenders)) {
				arrayExtenders = [];
			}
				
			// Ensure that all the extenders have the right structure.
			$.each(commonExtenders.concat(arrayExtenders), function() {
				if (!utils.isImplementing(this, ["name", "options"])) {
					throw new Error("An extender must be an object literal having a \"name\" and \"options\" properties.");
				}
			});
			
			// Extend a property with the specified extenders.
			var action = function(extenders) {
				return function(property) {
					property.value.extend(extenders);
				}
			};
			
			var options = {
				onArray: commonExtenders.length > 0 || arrayExtenders.length > 0 ? action(utils.arrayMapToObject(commonExtenders.concat(arrayExtenders), "name", "options")) : null,
				onFunction: commonExtenders.length > 0 ? action(utils.arrayMapToObject(commonExtenders, "name", "options")) : null
			};
			
			// Deeply traverse the underlying array and apply the extenders to all the mapped properties.
			factory.mappedObjectParser().process(this.inner, options);
			
			// Will add an extenders to the array if its not already a part of it.
			var addToArray = function(array, extenders) {
				$.each(extenders, function() {
					var index = utils.arrayIndexOf(array, this, function(actual, extender) {
						return actual.name === extender.name;
					});
				
					if (index === -1) {
						array.push(this);
					}
				});
			};
			
			addToArray(this._commonExtenders, commonExtenders);
			addToArray(this._arrayExtenders, arrayExtenders);
		},
		
		clone: function() {
		},
		
		unwrap: function() {
			return this.inner;
		},
	
		// // Une option pour mapper en observable avant d'ajouter ?
		// // Si est un Shelby.Model va automatiquement unwrapper avant d'ajouter.
		// // Permettre un "event" optionnel, s'il est spécifié ajouter l'élément directement au underlying array et fait ensuite un notifySubscriber (en fait probablement que toutes mes functions devraient permettre ça).
		// push: function(value, event) {
		// },
		
		// // Devrait permettre de spécifier un "event" optionnel ?
		// // Voir http://www.knockmeout.net/2012/04/knockoutjs-performance-gotcha.html  commentaire "//take advantage of push accepting variable arguments"
		// pushAll: function() {
		// },
		
		unshift: function() {
		},
		
		// unshiftAll: function() {
		// },
		
		remove: function() {
		},
		
		// removeAll: function() {
		// },
		
		destroy: function() {
		},
		
		// destroyAll: function() {
		// },
		
		length: function() {
			return this.inner().length;
		}
		
		// any, at (passe un index et retourne l'item à la position de l'index), indexOf, replace, each, find, first, equals, compare (pas certains pour celui la)
	};
	
	// **** Permettre un "event" optionnel, s'il est spécifier ajouter l'élément directement au underlying array et fait ensuite un notifySubscriber (en fait probablement que toutes mes functions devraient permettre ça). ****
	$.each(["push", "pushAll", "pop", "shift", "reverse", "sort", "splice", "slice"], function(i, propertyKey) {
		Shelby.ArrayModel.prototype[propertyKey] = function() {
			return this.inner[propertyKey].apply(this.inner, arguments);
		};
	});
	
	Shelby.ArrayModel.extend = extend;
	
	// Observable extenders
	// ---------------------------------
	
	ko.extenders.shelbyPausableObservable = function(target) {
		// When true, all the subscriptions are pause.
		var pauseAllSubscriptions = false;
	
		// Contains the id of the subscriptions that have been paused.
		target.pausedSubscriptions = [];
	
		// Instead of overriding the native knockout subscribe function, a function with
		// a new name is added to prevent pausing all the knockout native subscriptions
		// which would result in blocking native UI updates.
		target.pausableSubscription = function(subscriptionId, callback, callbackTarget /*, event */) {
			if (!$.isFunction(callback)) throw new Error("A callback function must be specified as the second argument.");
		
			// Remove the subscription id (arguments[0]) from the arguments before calling the native knockout subscription
			// function since it doesn't know about that property.
			[].shift.apply(arguments);
			
			// Define a proxy callback that implement the pausable behaviors to replace
			// the original one.
            var proxyCallback = function() {
                if (!target.isPause(subscriptionId)) {
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
					target.pause(subscriptionId);
				},
				resume: function() {
					target.resume(subscriptionId);
				},
				dispose: function() {
					// Make sure we dont leave any trace of the subscription.
					utils.arrayRemoveValue(target.pausedSubscriptions, subscriptionId);
					
					// Dispose KO subscription.
					subscription.dispose();
				}
			}
			
			return pausableSubscription;
		};
		
		target.pause = function(/* [subscriptionId] */) {
			if (arguments.length === 0 || utils.isNull(arguments[0])) {
				pauseAllSubscriptions = true;
			}
			else {
				var subscriptionId = arguments[0];
				
				if (utils.arrayIndexOf(this.pausedSubscriptions, subscriptionId) === -1) {
					this.pausedSubscriptions.push(subscriptionId);
				}
			}
		};
		
		target.resume = function(/* [subscriptionId] */) {
			if (arguments.length === 0 || utils.isNull(arguments[0])) {
				pauseAllSubscriptions = false;
			}
			else {
				utils.arrayRemoveValue(this.pausedSubscriptions, arguments[0]);
			}
		};
		
		target.isPause = function(/* [subscriptionId] */) {
			var subscriptionId = arguments[0];
		
			if (pauseAllSubscriptions) {
				return true;
			}
			else if (arguments.length === 0 || utils.isNull(subscriptionId)) {
				return pauseAllSubscriptions;
			}
			
			return utils.arrayIndexOf(this.pausedSubscriptions, subscriptionId) !== -1;
		};
	
		return target;
	};
	
	ko.extenders.shelbyArrayObservable = function(target) {
		if (!$.isArray(target.peek())) throw new Error("Observable underlying value must be an array.");
		
		target.push = function(value, event) {
			if (utils.isNull(value)) throw new Error("\"value\" must be non-null.");
			
			target.valueWillMutate();
			
			push(value);
			notifySubscribers(event);
		};
		
		target.pushAll = function(values, event) {
			if (!$.isArray(value)) throw new Error("\"values\" must be a non-null array.");
			
			if (values.length > 0) {
				target.valueWillMutate();
				
				$.each(values, function() {
					push(this);
				});
				
				notifySubscribers(event);
			}
		};
		
		function push(value) {
			if (isWrapped(value)) {
				target.peek().push(value.unwrap());
			}
			else {
				target.peek().push(value);
			}
		};
		
		function notifySubscribers(event) {
			if (utils.isString(event)) {
				target.notifySubscribers(event);
			}
			else {
				target.valueHasMutated();
			}
		};
		
		function isWrapped(value) {
			return utils.hasOwnProperty(value, "unwrap");
		};
		
		// // **** Permettre un "event" optionnel, s'il est spécifier ajouter l'élément directement au underlying array et fait ensuite un notifySubscriber (en fait probablement que toutes mes functions devraient permettre ça). ****
		// $.each(["pop", "shift", "reverse", "sort", "splice", "slice"], function(i, propertyKey) {
			// target[propertyKey] = function() {
				// return this.inner[propertyKey].apply(target, arguments);
			// };
		// });
	};
	
	ko.extenders.shelbyArrayPausableObservable = function(target) {
		if (!$.isArray(target.peek())) throw new Error("Observable underlying value must be an array.");
	
		var originalPausableObservable = target.pausableSubscription;
	
		target.pausableSubscription = function(subscriptionId, callback, callbackTarget, event) {
			if ($.isFunction(callback)) {
				return originalPausableObservable.apply(target, arguments);
			}
		
			if (!utils.isPartiallyImplementing(callback, ["add", "remove"])) {
				throw new Error("Callback type is not supported. The second argument must be a callback being either a function or an object literal having a \"add\" and/or \"remove\" properties which values are functions.");
			}
			
			if (utils.isString(event) && event.toLowerCase() === "beforechange") {
				throw new Error("\"beforeChange\" event is not supported.");
			}
			
			var previousArray = null;
		
			// Dont need to be a "pausable subscription" because we never stop tracking changes to the array,
			// even if the main subscription is paused.
			this.subscribe(function(array) {
				previousArray = utils.cloneArray(array);
			}, null, "beforeChange");
			
			return originalPausableObservable(subscriptionId, function(newArray) {
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
				
				if (added.length > 0 && $.isFunction(callback.add)) {
					callback.add.apply(this, [added]);
				}
				
				if (removed.length > 0 && $.isFunction(callback.remove)) {
					callback.remove.apply(this, [removed]);
				}
				
				previousArray = null;
			}, callbackTarget, event);
		};
	
		return target;
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
			if (!utils.isNullOrEmpty(data)) {
				return new Shelby.Model(data);
			}
			
			return null;
		},
		
		_convertModelToJS: function(model, operationContext) {
			if (!utils.isNull(model)) {
				return model.toJS();
			}
			
			return null;
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
		_ajaxFetch: function(request, options) {
			if (utils.isNull(request)) throw new Error("\"request\" must be a non null object literal.");
			if (utils.isNullOrEmpty(request.url)) throw new Error("\"request.url\" must be a non null or empty string.");
		
			var that = this,
				ajaxOptions = utils.clonePlainObject(request),
				operationContext = this._createAjaxOperationContext(request, Shelby.Ajax.Methods.Get);
			
			if ($.isFunction(this._beforeFetch)) {
				ajaxOptions.beforeSend = function() {
					// Prepend the original arguments with the operation context.
					var args = $.makeArray(arguments);
					args.unshift(operationContext);
					
					// The original jQuery AJAX "beforeSend" function support returning "false" to abort the
					// request, allow return to support that behavior.
					return that._beforeFetch.apply(that, args);
				};
			}
			
			// Using a "proxy" deferred to add custom mapping / error handling logics through 
			// the AJAX promise operations.
			var deferred = $.Deferred();
			
			// Execute the AJAX request.
			var ajaxPromise = factory.ajax().get(ajaxOptions);
				
			ajaxPromise.done(function(result) {
				// If the caller did not specify to ignore mapping, convert the fetched data to a Shelby model.
				if (utils.isNull(options) || options.preventResponseMapping !== true) {
					result = that._createModel(result, operationContext);
				}
			
				deferred.resolve(result);
			});
			
			ajaxPromise.fail(function(jqxhr, textStatus) {
				var errorData = that._createAjaxRequestErrorData(operationContext, jqxhr, textStatus);
				
				if ($.isFunction(that._handleError)) {
					that._handleError(errorData);
				}
			
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
				url: url,
				data: criteria
			});
		},
		
		detail: function(id) {
			var url = this._getUrl("detail");
			
			return this._ajaxGet({
				url: url,
				data: {
					id: id
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
		}
	};
	
	Shelby.ViewModel.OperationType = {
		Ajax: "AJAX"
	};
	
	Shelby.ViewModel.extend = extend;
	
	// // Shelby.ReactiveModel
	// // ---------------------------------
	
	// Shelby.ReactiveModel = function(data, mappingOptions) {
	// };
	
	// Shelby.ReactiveModel.prototype = {
	// };
	
	// Shelby.ReactiveModel.extend = extend;
	
	// // Shelby.TransactionalModel
	// // ---------------------------------
		
	// Shelby.TransactionalModel = function(data, mappingOptions) {
		// Shelby.Model.apply(this, [data, mappingOptions]);
	// };
	
	// Shelby.TransactionalModel.prototype = {
	// };
	
	// Shelby.TransactionalModel.extend = extend;
	
	// // Shelby.ModelComposer
	// // ---------------------------------
	
	// Shelby.ModelComposer = {
		// compose: function() {
			// return new function() {
				// Shelby.Model.apply(this, arguments);
				// Shelby.ReactiveModel.apply(this, []);
				// Shelby.TransactionalModel.apply(this, []);
			// };
		// }
	// };
	
	return Shelby;
}));

// À L'EXTÉRIEUR ROUTER

// À L'EXTÉRIEUR MAPPER (PEUT-ËTRE PAS)