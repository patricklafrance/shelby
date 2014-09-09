// Shelby._ViewModel.Extendable
// ---------------------------------

(function(namespace, utils) {
    "use strict";

    Shelby._ViewModel.Extendable = {
        _fromJS: function(obj, options) {
            // Convert properties to observables.
            var mapped = Shelby.components.mapper().fromJS(obj, options);
            
            // Extend all the object properties.
            this._applyExtendersToObject(mapped);
            
            return mapped;
        },
        
        _toJS: function(obj) {
            // Convert observables back to primitive values.
            var unmapped = Shelby.components.mapper().toJS(obj);
            
            // Remove all the extenders left on the object properties (ex. on objects).
            this._removeExtendersFromObject(unmapped);
            
            return unmapped;
        },

        _applyExtendersToObject: function(obj) {
            if (utils.objectSize(this._extenders) > 0) {
                Shelby.components.propertyExtender().add(obj, this._extenders);
            }
        },
        
        _removeExtendersFromObject: function(obj) {
            Shelby.components.propertyExtender().remove(obj);
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

    Shelby._ViewModel.Extendable._extenders = {
        "*": {
            "utility": Shelby.Extenders.utility,
            "subscribe": Shelby.Extenders.subscribe,
            "edit": Shelby.Extenders.edit
        }
    };
})(Shelby.namespace,
   Shelby.utils);