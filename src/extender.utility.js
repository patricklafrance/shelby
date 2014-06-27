// Shelby.Extenders - Utility
// ---------------------------------

(function(namespace, extend, utils, factory, PropertyType) {
    Shelby.Extenders.utility = function(target, type) {
        if (type !== PropertyType.Scalar) {
            // Copy all the functions to the target.
            $.extend(target[namespace], new Shelby.Extenders.utility.fn(target));
        }
    };
    
    Shelby.Extenders.utility.fn = Shelby.Extenders.base.fn.extend({
        reset: function() {
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
            factory.parser().parse(this._target(), {
                filter: function(key, propertyValue) {
                    // A property can be reset if it is an observable and has been extended with Shelby. Object cannot 
                    // be ignore because it will prevent us from parsing their children.
                    return key !== namespace && ((ko.isObservable(propertyValue) || utils.isObject(propertyValue)) && utils.isImplementingShelby(propertyValue));
                },
                onFunction: action
            });
        },
        
        updateFrom: function(obj) {
            if (!utils.isObject(obj)) {
                throw new Error("\"obj\" must be an object.");
            }

            try {
                factory.mapper().update(this._target(), obj);
            }
            catch (e) {
                throw new Error("An error occurred while updating the target object. Make sure that all the observables properties of the target object has been created by the Shelby mapper.");
            }
        }
    });
    
    Shelby.Extenders.utility.fn.extend = extend;
})(Shelby.namespace, 
   Shelby.extend,
   Shelby.utils,
   Shelby.Factory.instance,
   Shelby.PropertyType);