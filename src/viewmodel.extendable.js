// Shelby._.ViewModel.Extendable
// ---------------------------------

(function(namespace, utils) {
    Shelby._.ViewModel.Extendable = {
        _fromJS: function(obj, mappingOptions, extenders) {
            // Convert properties to observables.
            var mapped = Shelby.Components.mapper().fromJS(obj, mappingOptions);
            
            // Extend all the object properties.
            this._applyExtendersToObject(mapped, extenders);
            
            return mapped;
        },
        
        _toJS: function(obj) {
            // Convert observables back to primitive values.
            var unmapped = Shelby.Components.mapper().toJS(obj);
            
            // Remove all the extenders left on the object properties (ex. on objects).
            this._removeExtendersFromObject(unmapped);
            
            return unmapped;
        },

        _applyExtendersToObject: function(obj, extenders) {
            if (utils.isNull(extenders)) {
                extenders = Shelby.Components.extenderRegistry().getExtenders();
            }

            if (utils.objectSize(extenders) > 0) {
                Shelby.Components.propertyExtender().addExtenders(obj, extenders);
            }
        },
        
        _removeExtendersFromObject: function(obj) {
            Shelby.Components.propertyExtender().removeExtenders(obj);
        },

        _disposeAllSubscriptions: function() {
            var action = function(property) {
                if (utils.hasProperty(property.value, namespace) && utils.hasProperty(property.value[namespace], "unsuscribeAll")) {
                    property.value[namespace].unsuscribeAll();
                }
            };
        
            // Iterate on the view model properties to dispose all the subscriptions.
            Shelby.Components.parser().parse(this, {
                filter: Shelby.Components.filters().getExtendedPropertyFilter(),
                onObject: action
            });
        }
    };
})(Shelby.namespace,
   Shelby.utils);