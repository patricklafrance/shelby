// Shelby.Extenders
// ---------------------------------

(function(namespace, extend, utils) {
    var PropertyType = Shelby.PropertyType = {
        Object: 0,
        Array: 1,
        Scalar: 2
    };

    Shelby.Extenders = {};

    // ---------------------------------
    
    Shelby.ExtenderBase = function(target) {
        if (utils.isNull(this._target)) {
            this._target = function() {
                return target;
            };
        }
    };

    Shelby.ExtenderBase.extend = extend;

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
                Shelby.components.parser().parse(target, {
                    filter: Shelby.components.filters().getExtendablePropertyFilter(),
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
            Shelby.components.parser().parse(target, {
                filter: Shelby.components.filters().getExtendedPropertyFilter(),
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
    Shelby.components.registerComponent("propertyExtender", function() {
        return new Shelby.PropertyExtender();
    });
})(Shelby.namespace,
   Shelby.extend,
   Shelby.utils);