// Shelby.UtilityExtender
// ---------------------------------

(function(namespace, extend, utils) {
    var PropertyType = Shelby.PropertyType;

    Shelby.UtilityExtender = Shelby.ExtenderBase.extend({
        reset: function(/* resetValue, options */) {
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
            Shelby.Components.parser().parse(this._target(), {
                filter: Shelby.Components.filters().getExtendedPropertyFilter(),
                onFunction: action
            });
        },
        
        updateFrom: function(obj) {
            if (!utils.isObject(obj)) {
                throw new Error("\"obj\" must be an object.");
            }

            try {
                Shelby.Components.mapper().update(this._target(), obj);
            }
            catch (e) {
                throw new Error("An error occurred while updating the target object. Make sure that all the observables properties of the target object has been created by the Shelby mapper.");
            }
        }        
    });

    Shelby.UtilityExtender.extend = extend;

    // Register the components.
    Shelby.Components.registerTransientComponent("utilityExtender", function(target) {
        return new Shelby.UtilityExtender(target);
    });

    // ---------------------------------

    Shelby.Extenders.utilityExtender = function(target, type) {
        if (type !== PropertyType.Scalar) {
            var utilityExtender = Shelby.Components.utilityExtender(target);

            var facade = {
                reset: function() {
                    utilityExtender.reset.apply(utilityExtender, arguments);
                },

                updateFrom: function(obj) {
                    utilityExtender.updateFrom(obj);
                }
            };

            // Copy all the functions and properties to the target.
            $.extend(target[namespace], facade);
        }
    };

    Shelby.Extenders.registerExtender("utility", Shelby.Extenders.utilityExtender, "*");
})(Shelby.namespace, 
   Shelby.extend,
   Shelby.utils);