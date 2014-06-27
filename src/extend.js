// Shelby.extend
// ---------------------------------

(function(utils) {
    // Function use by some of the Shelby object to let you extend them with
    // additional instance properties.
    Shelby.extend = function(/* objects */) {
        if (arguments.length === 0) {
            throw new Error("At least 1 non-null plain object is required to extend a Shelby object.");
        }
        
        var objects = [];
        
        // Find all the objects that will extend the parent object.
        $.each(arguments, function(index, obj) {
            if (!utils.isObject(obj)) {
                throw new Error("Only non-null literal or prototyped object can extend a Shelby object.");
            }
            
            objects.push(utils.isNull(obj.prototype) ? obj : obj.prototype);
        });

        var parent = this;
        var child = null;

        // Mixin the parent prototype with the objects properties.
        var prototype = $.extend.apply($, [true, {}, parent.prototype].concat(objects));

        if ($.isFunction(prototype._initialize)) {
            child = function() {
                parent.apply(this, arguments);
                
                if ($.isFunction(prototype._initialize)) {
                    prototype._initialize.apply(this, arguments);
                }
            };
        }
        else {
            child = function() { 
                parent.apply(this, arguments);
            };
        }
        
        child.prototype = prototype;
        
        // Convenience property to access the parent prototype.
        child.prototype._super = parent.prototype;
        
        // Static function to allow multiple extends.
        child.extend = Shelby.extend;
        
        return child;
    };
})(Shelby.utils);