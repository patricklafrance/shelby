(function() {
    var knockout = require("knockout");
    var shelby = require("../../build/shelby.js");

    var ViewModel = shelby.ViewModel.extend({
        message: knockout.observable("Bootstrapping Shelby with browserify works!")
    });

    new ViewModel().bind();
})();