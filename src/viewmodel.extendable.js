// Shelby._ViewModel.Extendable
// ---------------------------------

(function(namespace, utils) {
    "use strict";

    Shelby._ViewModel.Extendable = {
        _fromJS: function(obj, mappingOptions, extenders) {
            // Convert properties to observables.
            var mapped = Shelby.components.mapper().fromJS(obj, mappingOptions);
            
            // Extend all the object properties.
            this._applyExtendersToObject(mapped, extenders);
            
            return mapped;
        },
        
        _toJS: function(obj) {
            // Convert observables back to primitive values.
            var unmapped = Shelby.components.mapper().toJS(obj);
            
            // Remove all the extenders left on the object properties (ex. on objects).
            this._removeExtendersFromObject(unmapped);
            
            return unmapped;
        },

        _applyExtendersToObject: function(obj, extenders) {
            if (utils.isNull(extenders)) {
                extenders = Shelby.components.extenderRegistry().getExtenders();
            }

            if (utils.objectSize(extenders) > 0) {
                Shelby.components.propertyExtender().addExtenders(obj, extenders);
            }
        },
        
        _removeExtendersFromObject: function(obj) {
            Shelby.components.propertyExtender().removeExtenders(obj);
        },

        _disposeAllSubscriptions: function() {
            var action = function(property) {
                if (utils.hasProperty(property.value, namespace) && utils.hasProperty(property.value[namespace], "unsuscribeAll")) {
                    property.value[namespace].unsuscribeAll();
                }
            };
        
            // Iterate on the view model properties to dispose all the subscriptions.
            Shelby.components.parser().parse(this, {
                filter: Shelby.components.filters().getExtendedPropertyFilter(),
                onObject: action
            });
        }
    };

    Shelby.registerExtender("utility", Shelby.Extenders.utility, "*");
    Shelby.registerExtender("subscribe", Shelby.Extenders.subscribe, "*");
    Shelby.registerExtender("edit", Shelby.Extenders.edit, "*");
})(Shelby.namespace,
   Shelby.utils);