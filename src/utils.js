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