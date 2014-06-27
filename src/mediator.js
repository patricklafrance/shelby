// Shelby.Mediator
//
// Facilitate loosely coupled inter-modules communication.
// ---------------------------------

(function(utils, factory) {
    Shelby.Mediator = function() {
        this._mediator = new ko.subscribable();
    };
    
    Shelby.Mediator.prototype = {
        subscribe: function(/* [channel], callback, [context] */) {
            var channel = null;
            var callback = null;
            var context = null;

            if ($.isFunction(arguments[0])) {
                callback = arguments[0];
                context = arguments[1];
            }
            else {
                channel = arguments[0];
                callback = arguments[1];
                context = arguments[2];
            }

            if (!$.isFunction(callback)) {
                throw new Error("\"callback\" must be a function.");
            }

            var subscription = null;

            if (utils.isNullOrEmpty(channel)) {
                subscription = this._mediator.subscribe(callback, context);
            }
            else {
                subscription = this._mediator.subscribe(callback, context, channel);
            }

            return {
                channel: channel,
                unsuscribe: function() {
                    subscription.dispose();
                }
            };
        },

        publish: function(/* [channel], value */) {
            var channel = null;
            var value = null;

            if (arguments.length > 1) {
                channel = arguments[0];
                value = arguments[1];
            }
            else {
                value = arguments[0];
            }

            if (utils.isNullOrEmpty(channel)) {
                this._mediator.notifySubscribers(value);
            }
            else {
                this._mediator.notifySubscribers(value, channel);
            }
        }
    };

    Shelby.Mediator.subscribe = function(/* [channel], callback, [context] */) {
        var instance = factory.mediator();

        return instance.subscribe.apply(instance, arguments);
    };

    Shelby.Mediator.publish = function(/* [channel], value */) {
        var instance = factory.mediator();

        instance.publish.apply(instance, arguments);
    };
})(Shelby.utils,
   Shelby.Factory.instance);