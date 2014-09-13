// Shelby.ExtenderRegistry
// ---------------------------------

(function(extend, utils) {
    "use strict";

    Shelby.ExtenderRegistry = function() {
        this._extenders = {};
        this._cache = {};
    };

    Shelby.ExtenderRegistry.prototype = {
        add: function(name, extender, path) {
            if (utils.isNullOrEmpty(name)) {
                throw new Error("\"name\" must be a non null or empty string.");
            }

            if (!$.isFunction(extender)) {
                throw new Error("\"extender\" must be a function that extend a property.");
            }

            if (utils.isNullOrEmpty(path)) {
                path = "*";
            }

            this._addExtender(path, name, extender);
        },

        _addExtender: function(path, name, extender) {
            if (utils.isNull(this._extenders[path])) {
                this._extenders[path] = {};
            }

            if (utils.isNull(this._extenders[path][name])) {
                this._extenders[path][name] = {};
            }

            this._extenders[path][name] = extender;
            this._invalidCache();
        },

        remove: function(name, path) {
            if (utils.isNullOrEmpty(name)) {
                throw new Error("\"name\" must be a non null or empty string.");
            }

            if (utils.isNullOrEmpty(path)) {
                path = "*";
            }

            if (!utils.isNull(this._extenders[path])) {
                if (!utils.isNull(this._extenders[path][name])) {
                    delete this._extenders[path][name];
                }

                if (utils.objectSize(this._extenders[path]) === 0) {
                    delete this._extenders[path];
                }

                this._invalidCache();
            }
        },

        getExtenders: function(path) {
            if (utils.isNullOrEmpty(path)) {
                path = "*";
            }

            var extenders = this._cache[path];

            if (utils.isNull(extenders)) {
                extenders = [];

                if (!utils.isNull(this._extenders[path])) {
                    for (var propertyKey in this._extenders[path]) {
                        extenders.push(this._extenders[path][propertyKey]);
                    }
                }

                this._cache[path] = extenders;
            }

            return extenders;
        },

        _invalidCache: function() {
            this._cache = {};
        }
    };

    Shelby.ExtenderRegistry.extend = extend;

    // Register the components.
    Shelby.components.registerComponent("extenderRegistry", function() {
        return new Shelby.ExtenderRegistry();
    });

    // ---------------------------------

    Shelby.registerExtender = function(name, extender, path) {
        Shelby.components.extenderRegistry().add(name, extender, path);
    };

    Shelby.removeExtender = function(name, path) {
        Shelby.components.extenderRegistry().remove(name, path);
    };
})(Shelby.extend,
   Shelby.utils);