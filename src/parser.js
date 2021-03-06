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