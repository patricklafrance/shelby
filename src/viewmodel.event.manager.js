// Shelby.EventManager
// ---------------------------------

(function(extend, utils) {
    "use strict";

    Shelby.EventManager = function() {
        this._eventHandlers = {};
    };

    Shelby.EventManager.prototype = {
        notifyHandlers: function(eventName, args, context) {
            if (utils.isNullOrEmpty(eventName)) {
                throw new Error("\"eventName\" must be a non null or empty string.");
            }

            var handlers = this._eventHandlers[eventName];

            if ($.isArray(handlers))  {
                for (var i = 0, max = handlers.length; i < max; i += 1) {
                    handlers[i].callback.apply(context, args);
                }
            }
        },

        registerEventHandler: function(eventName, callback) {
            if (utils.isNullOrEmpty(eventName)) {
                throw new Error("\"eventName\" must be a non null or empty string.");
            }

            if (!$.isFunction(callback)) {
                throw new Error("\"callback\" must be a function.");
            }

            if (utils.stringContains(eventName, ".")) {
                var descriptor = this._parseEventName(eventName);

                this._addEventHandler(descriptor.event, descriptor.name, callback);
            }
            else {
                this._addEventHandler(eventName, null, callback);
            }
        },

        _addEventHandler: function(event, name, callback) {
            if (!$.isArray(this._eventHandlers[event])) {
                this._eventHandlers[event] = [];
            }

            this._eventHandlers[event].push({
                name: name,
                callback: callback
            });
        },

        removeEventHandler: function(eventName) {
            if (utils.isNullOrEmpty(eventName) || !utils.stringContains(eventName, ".")) {
                throw new Error("\"eventName\" must be a non null or empty string and be a named event (ex. foo.beforeFetch).");
            }

            var descriptor = this._parseEventName(eventName);
            var handlers = this._eventHandlers[descriptor.event];

            if ($.isArray(handlers)) {
                utils.arrayRemoveValue(handlers, descriptor.name, function(item) {
                    return item.name === descriptor.name;
                });
            }
        },

        _parseEventName: function(eventName) {
            var dotIndex = eventName.indexOf(".");

            return {
                name: eventName.substring(dotIndex + 1),
                event: eventName.substring(0, dotIndex)
            };
        }
    };

    Shelby.EventManager.extend = extend;

    // Register the components.
    Shelby.components.registerComponent("eventManager", function() {
        return new Shelby.EventManager();
    });

    // ---------------------------------

    Shelby.registerEventHandler = function(eventName, callback) {
        Shelby.components.eventManager().registerEventHandler(eventName, callback);
    };

    Shelby.removeEventHandler = function(eventName) {
        Shelby.components.eventManager().removeEventHandler(eventName);
    };
})(Shelby.extend,
   Shelby.utils);