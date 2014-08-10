// Shelby.Extenders - Subscribe
// ---------------------------------

(function(namespace, extend, utils, factory, PropertyType) {
    ko.extenders.shelbySubscribe = function(target) {
        // When true, all the subscriptions are pause.
        var pauseAllSubscriptions = false;
        
        $.extend(target[namespace], {
            subscribe: function(callback /*, [callbackTarget], [event] */) {
                if (!$.isFunction(callback)) {
                    throw new Error("First argument must be a callback function.");
                }
            
                /* jshint ignore:start */
                // Must keep a locally scoped variable of the callback otherwise IE 8 and 9 cause stack
                // overflow error.
                var originalCallback = callback;

                arguments[0] = function(value) {
                    if (!pauseAllSubscriptions && !pausableSubscription.isPause) {
                        // If this observable is not paused globally or this subscription is not paused,
                        // call the original callback with the original arguments.
                        originalCallback.apply(this, [value]);
                    }
                };
                /* jshint ignore:end */

                // Call the original knockout subscription function.
                var subscription = target.subscribe.apply(target, arguments);
                
                var pausableSubscription = {
                    isPause: false,
                
                    pause: function() {
                        this.isPause = true;
                    },
                    resume: function() {
                        this.isPause = false;
                    },
                    dispose: function() {
                        subscription.dispose();
                    }
                };
                
                return pausableSubscription;
            },
            
            pause: function() {
                pauseAllSubscriptions = true;
            },
            
            resume: function() {
                pauseAllSubscriptions = false;
            },
            
            isPause: function() {
                return pauseAllSubscriptions;
            }
        });
        
        return target;
    };

    // ---------------------------------

    ko.extenders.shelbyArraySubscribe = function(target) {
        var originalSubscribe = target[namespace].subscribe;

        if (!$.isFunction(originalSubscribe)) {
            throw new Error("The observable must be extended with \"ko.extenders.shelbySubscribe\".");
        }

        $.extend(target[namespace], {
            subscribe: function(callback /*, [callbackTarget], [event], [options] */) {
                var evaluateChanges = !utils.isObject(arguments[3]) || arguments[3].evaluateChanges !== false;

                if (evaluateChanges) {
                    if (!$.isFunction(callback)) {
                        throw new Error("First argument must be a callback function.");
                    }

                    /* jshint ignore:start */
                    // Must keep a locally scoped variable of the callback otherwise IE 8 and 9 cause stack
                    // overflow error.
                    var originalCallback = callback;

                    // Proxy callback function adding the array changes behavior.
                    arguments[0] = function(value) {
                        originalCallback.apply(this, [{ value: value }, true, "shelbyArraySubscribe"]);
                    };

                    // To activate the native array changes evaluation, the event must be "arrayChange",
                    // otherwise the standard observable subscription behaviour is applied.
                    arguments[2] = "arrayChange";
                    /* jshint ignore:end */
                }

                // Add the subscription.
                return originalSubscribe.apply(this, arguments);
            }
        });
    };

    // ---------------------------------

    Shelby.Extenders.subscribe = function(target, type) {
        // Apply the observable extenders to everything that is an observable.
        if (type !== PropertyType.Object) {
            target.extend(this._observableExtenders["*"]);
            
            if (type === PropertyType.Array) {
                var arrayExtenders = this._observableExtenders["array"];

                if (!utils.isNull(arrayExtenders)) {
                    target.extend(arrayExtenders);
                }
            }
            
            target[namespace]._subscriptions = {};
        }
        
        if (type === PropertyType.Object) {
            // Copy all the functions to the target.
            $.extend(target[namespace], new Shelby.Extenders.subscribe._ctor(target));
        }
    };
    
    Shelby.Extenders.subscribe._ctor = Shelby.Extenders.base.extend({
        _initialize: function() {
            this._delegatedSubscriptions = {};
        },
    
        subscribe: function(callback, options) {
            if (utils.isNull(callback)) {
                throw new Error("\"callback\" must be a function.");
            }
            
            var that = this;
            
            options = options || {};
            options.array = options.array || {};

            var propertyFilter = factory.filters().getPathFilter(options.include, options.exclude);
            
            var subscription = {
                // Unique identifier of the subscription.
                id: utils.generateGuid(),
                
                // Array having all the members of the subscriptions.
                members: [],
                
                // True if the subscription is paused, false otherwise.
                isPause: false,
                
                // The original subscription callback provided by the caller.
                callback: callback,
                
                pause: function() {
                    that._pauseSubscription(this);
                },
                resume: function() {
                    that._resumeSubscription(this);
                },
                dispose: function() {
                    that._disposeSubscription(this);
                }
            };
            
            // Add the current object properties to the subscriptions.
            this._addToSubscription(this._target(), subscription, propertyFilter, options, { path: "" });
            
            // If at least a property has been subscribed to, save the subscription data for further operations that handles
            // multiple subscriptions like "unsucribeAll", "mute" and "resume".
            if (subscription.members.length > 0) {
                this._delegatedSubscriptions[subscription.id] = subscription;
            }
            
            return subscription;
        },

        _addToSubscription: function(target, subscription, propertyEvaluator, options, context) {
            var that = this;
        
            // Handler called to subscribe to a property.
            var subscriber = $.isFunction(options.subscriber) ? options.subscriber : this._propertySubscriber;
        
            var action = function(property) {
                // Must do this check because of the automatic subscription of array's new items.
                if (utils.isImplementingShelby(property.value)) {
                    // Must consider a contextual path and parent to fully support the automatic subscription of array's new items.
                    var path = property.path === "/" && !utils.isNullOrEmpty(context.path) ? context.path : context.path + property.path;
                    var parent = property.path === "/" && !utils.isNull(context.parent) ? context.parent : property.parent;
                    var evaluationResult = propertyEvaluator(path);

                    // Even if this is not a perfect match, there is cases (like arrays) when we want to add a subscription
                    // to the property to handle special behaviors (like item's automatic subscriptions for arrays).
                    if (evaluationResult.isValid) {
                        // Abstraction to add additional informations when a subscription is triggered.
                        var proxyCallback = function(value, extendArguments, extender) {
                            var args = {
                                path: path,
                                parent: parent,
                                subscription: subscription
                            };
                            
                            // Give you more flexibility for the subscription arguments if you decide to write
                            // a custom extender and use it through the "subscriber" option by letting you extend
                            // the arguments that are passed to the subscriber.
                            $.extend(args, extendArguments === true ? value : { value: value });

                            if (extender === "shelbyArraySubscribe" && options.array.trackChildren !== false) {
                                $.each(value.value, function() {
                                    if (this.status === "added") {
                                        // If a custom extender indicate that an item is added to an array, automatically 
                                        // subscribe to that new item.
                                        that._addToSubscription(this.value, subscription, propertyEvaluator, options, {
                                            path: utils.stringEnsureEndsWith(path, "/") + "i",
                                            parent: property.value
                                        });
                                    }
                                    else if (this.status === "deleted") {
                                        // If a custom extender indicate that an item is removed from an array, automatically 
                                        // dispose all the subscriptions owned by that item.
                                        that._removeFromSubscription(this.value, subscription);
                                    }
                                });
                            }

                            if (evaluationResult.isPerfectMatch) {
                                // Notify subscribers.
                                subscription.callback.call(this, args);
                            }
                        };
                        
                        // Subscribe to the property.
                        var propertySubscription = subscriber(property, proxyCallback, options);
                        
                        // Save the property subscription on the property itself.
                        property.value[namespace]._subscriptions[subscription.id] = propertySubscription;
                        
                        // Add the property to the group.
                        subscription.members.push(property.value);
                    }
                }
            };
            
            // Iterate on the target properties to subscribe on all the observables matching criterias.
            factory.parser().parse(target, {
                filter: factory.filters().getExtendedPropertyFilter(),
                onArray: action,
                onFunction: action
            });
        },
        
        _removeFromSubscription: function(target, subscription) {
            var action = function(property) {
                var propertySubscription = property.value[namespace]._subscriptions[subscription.id];
                
                if (!utils.isNull(propertySubscription)) {
                    // Dispose KO subscription.
                    propertySubscription.dispose();
                    
                    // Remove the subscriptions from the repository.
                    delete property.value[namespace]._subscriptions[subscription.id];
                    
                    // Remove the property from the group.
                    utils.arrayRemoveValue(subscription.members, property.value);
                }
            };
        
            // Iterate on the target properties to dispose the subscriptions from all the observables matching criterias.
            factory.parser().parse(target, {
                filter: factory.filters().getExtendedPropertyFilter(),
                onArray: action,
                onFunction: action
            });
        },
        
        _propertySubscriber: function(property, callback, options) {
            var subscriptionOptions = null;

            // In case of an array, if a specific event has been specified, the array changes evaluation
            // will not be applied.
            if ($.isArray(property.value.peek()) && (options.array.evaluateChanges === false || !utils.isNullOrEmpty(options.event))) { 
                subscriptionOptions = { evaluateChanges: false };
            }

            return property.value[namespace].subscribe(callback, options.callbackTarget, options.event, subscriptionOptions);
        },
        
        _pauseSubscription: function(subscription) {
            this._executeSubscriptionOperation(subscription, function(propertySubscription) {
                propertySubscription.pause();
            });
            
            subscription.isPause = true;
        },
        
        _resumeSubscription: function(subscription) {
            this._executeSubscriptionOperation(subscription, function(propertySubscription) {
                propertySubscription.resume();
            });
            
            subscription.isPause = false;
        },
        
        _disposeSubscription: function(subscription) {
            this._executeSubscriptionOperation(subscription, function(propertySubscription) {
                propertySubscription.dispose();
            });

            utils.arrayClear(subscription.members);
            
            delete this._delegatedSubscriptions[subscription.id];
        },
        
        _executeSubscriptionOperation: function(subscription, action) {
            $.each(subscription.members, function() {
                var propertySubscription = this[namespace]._subscriptions[subscription.id];
                
                if (!utils.isNull(propertySubscription)) {
                    action(propertySubscription);
                }
            });
        },
        
        // Dispose of all the subscriptions.
        unsuscribeAll: function() {
            var that = this;
        
            $.each(this._delegatedSubscriptions, function() {
                that._disposeSubscription(this);
            });
        },
        
        // Pause all the subscriptions.
        mute: function() {
            var that = this;
        
            $.each(this._delegatedSubscriptions, function() {
                that._pauseSubscription(this);
            });
        },
        
        // Resume all the subscriptions.
        unmute: function() {
            var that = this;
        
            $.each(this._delegatedSubscriptions, function() {
                that._resumeSubscription(this);
            });
        }
    });
    
    Shelby.Extenders.subscribe._ctor.extend = extend;
    
    Shelby.Extenders.subscribe._observableExtenders = { 
        "*": {
            shelbySubscribe: true
        },
        "array": {
            shelbyArraySubscribe: true
        }
    };
})(Shelby.namespace, 
   Shelby.extend,
   Shelby.utils,
   Shelby.Factory.instance,
   Shelby.PropertyType);