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
				var proceed = true;
			
				for (var childKey in obj) {
					if (utils.hasOwnProperty(obj, childKey)) {
						proceed = this._next(childKey, obj[childKey], path, obj);
						
						if (proceed === false) {
							break;
						}
					}
				}
				
				if (proceed !== false) {
					proceed = this._scalar(key, obj, path, parent, this._options.onObject);
				}
				
				return proceed;
			},
			
			_array: function(key, array, path) {
				var unwrappedArray = array.peek(),
					proceed = true;
			
				for (var i = 0, max = unwrappedArray.length; i < max; i += 1) {
					proceed = this._next("i", unwrappedArray[i], path, array);
					
					if (proceed === false) {
						break;
					}
				}
				
				if (proceed !== false) {
					proceed = this._scalar(key, array, path, parent, this._options.onArray);
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