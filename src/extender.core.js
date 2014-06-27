// Shelby.Extenders - Core
// ---------------------------------

(function(namespace, extend, utils, factory) {
    var PropertyType = Shelby.PropertyType = {
        Object: 0,
        Array: 1,
        Scalar: 2
    };

    Shelby.Extenders = {};

    // ---------------------------------
    
    Shelby.Extenders.base = function() {
    };
    
    Shelby.Extenders.base.fn = function(target) {
        if (utils.isNull(this._target)) {
            this._target = function() {
                return target;
            };
        }
    };
    
    Shelby.Extenders.base.fn.extend = extend;

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
            if (utils.isNull(target)) {
                throw new Error("\"target\" must be an object.");
            }
        
            var action = function(property) {
                delete property.value[namespace];
            };
        
            // Iterate on the target properties to remove shelby extenders.
            factory.parser().parse(target, {
                filter: function(key, value) {
                    // A property can have extender to remove if it is an observable or an object and has
                    // been extend by Shelby.
                    return (ko.isObservable(value) || utils.isObject(value)) && utils.isImplementingShelby(value);
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