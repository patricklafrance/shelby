// Shelby.Factory
//
// Factory creating lazy singleton for Shelby dependency objects. This allow you to easily
// modify the dependency objects prototype before Shelby instantiate and use them.
// ---------------------------------

(function(extend, utils) {
    Shelby.Factory = function() {
        this._filter = null;
        this._propertyExtender = null;
        this._parser = null;
        this._ajax = null;
        this._mapper = null;
        this._mediator = null;
    };
    
    Shelby.Factory.prototype = {
        filter: function() {
            if (utils.isNull(this._filter)) {
                this._filter = new Shelby.Filter();
            }
            
            return this._filter;
        },

        propertyExtender: function() {
            if (utils.isNull(this._propertyExtender)) {
                this._propertyExtender = new Shelby.PropertyExtender();
            }
            
            return this._propertyExtender;
        },
        
        parser: function() {
            if (utils.isNull(this._parser)) {
                this._parser = new Shelby.Parser();
            }
            
            return this._parser;
        },
        
        ajax: function() {
            if (utils.isNull(this._ajax)) {
                this._ajax = new Shelby.Ajax();
            }
            
            return this._ajax;
        },
        
        mapper: function() {
            if (utils.isNull(this._mapper)) {
                this._mapper = new Shelby.Mapper();
            }
            
            return this._mapper;
        },

        mediator: function() {
            if (utils.isNull(this._mediator)) {
                this._mediator = new Shelby.Mediator();
            }
            
            return this._mediator;
        }
    };
    
    Shelby.Factory.extend = extend;
    Shelby.Factory.instance = new Shelby.Factory();
})(Shelby.extend, 
   Shelby.utils);