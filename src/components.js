// Shelby.Components
// ---------------------------------

(function(extend, utils) {
    Shelby.Components = {};

    // ---------------------------------

    var ComponentsFactory = Shelby.ComponentsFactory = function() {
        this._components = {};
        this._instances = {};
    };

    Shelby.ComponentsFactory.prototype = {
        registerComponent: function(name, factory) {
            var that = this;

            if (utils.isNullOrEmpty(name)) {
                throw new Error("\"name\" must be a non-null or empty component name.");
            }

            if (!$.isFunction(factory)) {
                throw new Error("\"factory\" must be a function to create instances of the component.");
            }

            this._components[name] = function(args) {
                var instance = that._instances[name];

                if (utils.isUndefined(instance)) {
                    instance = that._instances[name] = factory(args);
                }

                return instance;
            };
        },

        registerTransientComponent: function(name, factory) {
            if (utils.isNullOrEmpty(name)) {
                throw new Error("\"name\" must be a non-null or empty component name.");
            }

            if (!$.isFunction(factory)) {
                throw new Error("\"factory\" must be a function to create instances of the component.");
            }

            this._components[name] = factory;
        },

        getComponent: function(name, args) {
            var factory = this._components[name];

            if (!$.isFunction(factory)) {
                throw new Error(utils.stringFormat("Cannot find a component factory for {1}", name));
            }

            return factory(args);
        }
    };

    ComponentsFactory.extend = extend;

    // ---------------------------------

    $.extend(true, Shelby, {
        _componentsFactory: null,

        setComponentFactory: function(factory) {
            if (utils.isNull(factory)) {
                throw new Error("\"factory\" must be an object.");
            }

            this._componentsFactory = factory;
        },

        registerComponent: function(name, factory) {
            var that = this;

            this._componentsFactory.registerComponent(name, factory);

            // Define a shortcut function to access the component.
            Shelby.Components[name] = function(args) {
                return that._componentsFactory.getComponent(name, args);
            };
        },

        registerTransientComponent: function(name, factory) {
            var that = this;

            this._componentsFactory.registerTransientComponent(name, factory);

            // Define a shortcut function to access the component.
            Shelby.Components[name] = function(args) {
                return that._componentsFactory.getComponent(name, args);
            };          
        }
    });

    // Register a default factory.
    Shelby.setComponentFactory(new ComponentsFactory()); 
})(Shelby.extend,
   Shelby.utils);