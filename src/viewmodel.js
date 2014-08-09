// Shelby.ViewModel
// ---------------------------------

(function(namespace, extend, utils, factory) {
    Shelby.ViewModel = function() {
        this.element = null;
    };
    
    Shelby.ViewModel.prototype = {
        // Proxy constructor function that should be override by you. 
        // If defined, it will be invoked when the model is created after all the 
        // initialization logic is done.
        _initialize: null,
    
        // If defined by you, it will be invoked before binding the view model with the DOM. 
        // By default, the bindings will be applied after your handler execution, if you want to do asynchronous
        // operations your handler function must return true and then call the callback function parameter 
        // when your operations are completed.
        //  - callback: A function that you can call when your asynchronous operations are completed.
        _beforeBind: null,
        _afterBind: null,

        // If defined by you, it will be invoked when disposing the view model.
        _handleDispose: null,

        // Apply the KO bindings with the view model.
        //  - element : a DOM or jQuery element to use as the root.
        bind: function(element) {
            var that = this;
            var deferred = new $.Deferred();

            var applyBindings = function() {
                that._applyBindings();
                deferred.resolve();
            };
		
            this.element = this._getDomElement(element);
            
            if ($.isFunction(this._beforeBind)) {
                var isAsync = this._beforeBind.call(this, applyBindings);
				
                if (isAsync !== true) {
                    applyBindings();
                }
            }
            else {
                applyBindings();
            }
			
            return deferred.promise();
        },
        
        _getDomElement: function(element) {
            if (utils.isjQueryElement(element) && element.length > 0) {
                element = element[0];
            }
            
            return element;
        },
        
        _applyBindings: function() {
            ko.applyBindings(this, this.element);
            
            if ($.isFunction(this._afterBind)) {
                this._afterBind.call(this);
            }
        },
        
        _fromJS: function(obj, options) {
            // Convert properties to observables.
            var mapped = factory.mapper().fromJS(obj, options);
            
            // Extend all the object properties.
            this._applyExtendersToObject(mapped);
            
            return mapped;
        },
        
        _toJS: function(obj) {
            // Convert observables back to primitive values.
            var unmapped = factory.mapper().toJS(obj);
            
            // Remove all the extenders left on the object properties (ex. on objects).
            this._removeExtendersFromObject(unmapped);
            
            return unmapped;
        },

        _applyExtendersToObject: function(obj) {
            if (utils.objectSize(this._extenders) > 0) {
                factory.propertyExtender().add(obj, this._extenders);
            }
        },
        
        _removeExtendersFromObject: function(obj) {
            factory.propertyExtender().remove(obj);
        },
        
        dispose: function() {
            this._disposeAllSubscriptions();
            this._disposeBindings();

            if ($.isFunction(this._handleDispose)) {
                this._handleDispose.call(this);
            }

            /* jshint -W051 */
            delete this;
            /* jshint +W051 */
        },

        _disposeBindings: function() {
            if (utils.isDomElement(this.element)) {
                // Clean the KO bindings on the specified DOM element.
                if (ko.dataFor(this.element)) {
                    ko.cleanNode(this.element);
                }
            }
        },

        _disposeAllSubscriptions: function() {
            var action = function(property) {
                if (utils.hasProperty(property.value, namespace) && utils.hasProperty(property.value[namespace], "unsuscribeAll")) {
                    property.value[namespace].unsuscribeAll();
                }
            };
        
            // Iterate on the view model properties to dispose all the subscriptions.
            factory.parser().parse(this, {
                filter: factory.filters().getExtendedPropertyFilter(),
                onObject: action
            });
        }
    };

    Shelby.ViewModel.prototype._extenders = {
        "*": {
            "utility": Shelby.Extenders.utility,
            "subscribe": Shelby.Extenders.subscribe,
            "edit": Shelby.Extenders.edit
        }
    };
    
    Shelby.ViewModel.extend = extend;
})(Shelby.namespace, 
   Shelby.extend, 
   Shelby.utils, 
   Shelby.Factory.instance);

