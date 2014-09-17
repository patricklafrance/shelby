// Shelby.Mapper
// ---------------------------------

(function(extend) {
    Shelby.Mapper = function() {
    };

    Shelby.Mapper.prototype = {
        fromJS: function() {
            return koViewModel.fromModel.apply(koViewModel, arguments);
        },
        
        toJS: function() {
            return koViewModel.toModel.apply(koViewModel, arguments);
        },
        
        update: function() {
            return koViewModel.updateFromModel.apply(koViewModel, arguments);
        }
    };
    
    Shelby.Mapper.extend = extend;

    // Register the components.
    Shelby.Components.registerComponent("mapper", function() {
        return new Shelby.Mapper();
    });
})(Shelby.extend);