// Shelby.editExtender
// ---------------------------------

(function(namespace, extend, utils) {
    var PropertyType = Shelby.PropertyType;

    ko.extenders.shelbyEdit = function(target) {
        if (!$.isFunction(target[namespace].pause) || !$.isFunction(target[namespace].resume)) {
            throw new Error(utils.stringFormat("\"shelbyEditable\" can only extends an observable having \"{1}.pause\" and \"{1}.resume\" functions.", namespace));
        }

        var wasPause = false;
    
        $.extend(target[namespace], {
            current: target.peek(),
            
            hasMutated: false,
            isEditing: false,
            deferNotifications: false,
            
            beginEdit: function(deferNotifications) {
                if (!this.isEditing) {
                    this.current = target.peek();
                    this.deferNotifications = deferNotifications !== false ? true : false;

                    if (this.deferNotifications) {
                        // Must keep track of the subscription "pause" status at the beginning of the edition
                        // to prevent resuming the subscription at the end of the edition if it was originally pause.
                        wasPause = target[namespace].isPause();

                        if (!wasPause) {
                            // Prevent the propagation of the notifications to subscribers before an
                            // explicit call to "endEdit" function has been made.
                            target[namespace].pause();
                        }
                    }

                    // Start edition.
                    this.isEditing = true;
                }
            },
            
            endEdit: function(canNotify) {
                var that = this;

                if (this.isEditing && this.hasMutated) {
                    this.current = target.peek();
                }
                
                if (this.isEditing) {
                    if (!wasPause && this.deferNotifications !== false) {
                        var hasMutated = that.hasMutated;

                        // Defer the "resume" to prevent synchronization problem with the UI.
                        setTimeout(function() {
                            target[namespace].resume();

                            // When the notifications are resumed, if the observable has been edited and the mute options
                            // is not specified, force a notification since the previous notifications has been "eat" because
                            // the notifications were paused.
                            if (hasMutated && canNotify !== false) {
                                target.valueWillMutate();
                                target.valueHasMutated();
                            }

                            
                        }, 10);
                    }
                }
                           
                this.hasMutated = false;     
                this.isEditing = false;
            },

            resetEdit: function() {
                if (this.isEditing && this.hasMutated) {
                    target(this.current);
                }
            },
            
            cancelEdit: function() {
                target[namespace].resetEdit();

                if (this.isEditing) {
                    if (!wasPause && this.deferNotifications !== false) {
                        // Defer the "resume" to prevent synchronization problem with the UI.
                        setTimeout(function() {
                            target[namespace].resume();
                        }, 10);
                    }
                }
                
                this.isEditing = false;
                this.hasMutated = false;
            }
        });
        
        target.subscribe(function(value) {
            if (!utils.isNull(target[namespace]) && target[namespace].isEditing && !target[namespace].hasMutated) {
                if ($.isArray(value)) {
                    target[namespace].hasMutated = ko.utils.compareArrays(target[namespace].current, value).length === 0;
                }
                else {
                    target[namespace].hasMutated = value !== target[namespace].current;
                }
            }
        });
        
        return target;
    };

    // ---------------------------------

    Shelby.editExtender = function(target, type) {
        if (type !== PropertyType.Object) {
            target.extend(this._observableExtenders);
        }
        
        if (type === PropertyType.Object) {
            // Copy all the functions to the target.
            $.extend(target[namespace], new Shelby.editExtender._ctor(target));
        }
    };
    
    Shelby.editExtender._ctor = Shelby.extenderBase.extend({
        _initialize: function() {
            this.isEditing = false;
        
            // Options for the current edition. 
            // The object structure is:
            //  - include: An array of property paths that will compose the edition.
            //  - exclude: An array of property paths that will be exclude from the edition.
            this._editOptions = null;
        },
        
        beginEdit: function(options) {
            if (!this.isEditing) {
                this._editOptions = options || {};
            
                this._executeEditAction(function(property) {
                    property.value[namespace].beginEdit(this._editOptions.deferNotifications);
                });
                
                this.isEditing = true;
            }
        },

        endEdit: function(notifyOnce) {
            if (this.isEditing) {
                // Evaluator that handles the notifications count option.
                var canNotify = null;
                
                if (notifyOnce === true) {
                    if (this._editOptions.deferNotifications === true) {
                        throw new Error("The \"notify once\" options is not supported when the edition has been started with the \"defer notifications\" disabled.");
                    }

                    canNotify = function(context) {
                        return context.count === 1;
                    };
                }
                else {
                    canNotify = function() {
                        return true;
                    };
                }
                
                var action = function(property, context) {
                    if (property.value[namespace].isEditing === true) {
                        if (property.value[namespace].hasMutated) {
                            context.count += 1;
                        }

                        property.value[namespace].endEdit(canNotify(context));
                    }
                };
            
                this._executeEditAction(action, {
                    count: 0
                });
                
                this.isEditing = false;
            }
        },

        resetEdit: function() {
            if (this.isEditing) {
                this._executeEditAction(function(property) {
                    if (property.value[namespace].isEditing === true) {
                        property.value[namespace].resetEdit();
                    }
                });
            }
        },
        
        cancelEdit: function() {
            if (this.isEditing) {
                this._executeEditAction(function(property) {
                    if (property.value[namespace].isEditing === true) {
                        property.value[namespace].cancelEdit();
                    }
                });
                
                this.isEditing = false;
            }
        },
        
        hasMutated: function() {
            var ret = false;
        
            if (this.isEditing) {
                this._executeEditAction(function(property) {
                    if (property.value[namespace].hasMutated) {
                        ret = true;
                        
                        return false;
                    }
                });
            }
            
            return ret;
        },
        
        _executeEditAction: function(action, context) {
            var that = this;

            // Filter that handles the include / exclude options by evaluating the property
            // paths against the specified options and filter out the paths that doesn't match the 
            // options.
            var propertyEvaluator = Shelby.components.filters().getPathFilter(this._editOptions.include, this._editOptions.exclude);
        
            var execute = function(property) {
                if (propertyEvaluator(property.path).isPerfectMatch) {
                    return action.apply(that, [property, context]);
                }
            };
        
            // Iterate on the target properties to execute the action on all the observables matching criterias.
            Shelby.components.parser().parse(this._target(), {
                filter: Shelby.components.filters().getExtendedPropertyFilter(),
                onArray: execute,
                onFunction: execute
            });
        }
    });
    
    Shelby.editExtender._ctor.extend = extend;
    
    Shelby.editExtender._observableExtenders = {
        shelbyEdit: true
    };
})(Shelby.namespace,
   Shelby.extend,
   Shelby.utils);