// Shelby._.ViewModel.Bindable
// ---------------------------------

(function(utils) {
    Shelby._.ViewModel.Bindable = {
        _beforeBind: null,
        _afterBind: null,

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

        _disposeBindings: function() {
            if (utils.isDomElement(this.element)) {
                // Clean the KO bindings on the specified DOM element.
                if (ko.dataFor(this.element)) {
                    ko.cleanNode(this.element);
                }
            }
        }
    };
})(Shelby.utils);