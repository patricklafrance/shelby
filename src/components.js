// Shelby.Components
// ---------------------------------

(function(extend, utils) {
    "use strict";

    var ComponentsFactory = Shelby.ComponentsFactory = function() {
        this._components = {};
        this._instances = {};
    };

    Shelby.ComponentsFactory.prototype = {
        registerComponent: function(name, factory) {
            if (utils.isNullOrEmpty(name)) {
                throw new Error("\"name\" must be a non-null or empty component name.");
            }

            if (!$.isFunction(factory)) {
                throw new Error("\"factory\" must be a function to create instances of the component.");
            }

            this._components[name] = factory;
        },

        getComponent: function(componentName) {
            var instance = this._instances[componentName];

            if (utils.isNull(instance)) {
                var factory = this._components[componentName];

                if (!$.isFunction(factory)) {
                    throw new Error(utils.stringFormat("Cannot find a component factory for {1}", componentName));
                }

                instance = this._instances[componentName] = factory();
            }

            return instance;
        }
    };

    ComponentsFactory.extend = extend;

    // ---------------------------------

    var Components = Shelby.components = {
        factory: null,

        setComponentFactory: function(factory) {
            if (utils.isNull(factory)) {
                throw new Error("\"factory\" must be an object.");
            }

            this.factory = factory;
        },

        registerComponent: function(name, factory) {
            this.factory.registerComponent(name, factory);
        }
    };

    // Define functions to easily requiert native components.
    $.each(["filters", "propertyExtender", "parser", "ajax", "mapper"], function() {
        var componentName = this;

        Components[componentName] = function() {
            return Components.factory.getComponent(componentName);
        };
    });

    // Register a default factory.
    Components.setComponentFactory(new ComponentsFactory()); 
})(Shelby.extend,
   Shelby.utils);