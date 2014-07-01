// Shelby.Mapper
// ---------------------------------

(function(extend) {
    Shelby.Mapper = function() {
    };

    Shelby.Mapper.prototype = {
        fromJS: function() {
            return ko.viewmodel.fromModel.apply(ko.viewmodel, arguments);
        },
        
        toJS: function() {
            return ko.viewmodel.toModel.apply(ko.viewmodel, arguments);
        },
        
        update: function() {
            return ko.viewmodel.updateFromModel.apply(ko.viewmodel, arguments);
        }
    };
    
    Shelby.Mapper.extend = extend;
})(Shelby.extend);