(function() {
	require.config({
	    paths: {
	    	"jquery": "../../lib/jquery-1.10.2",
	    	"knockout.viewmodel": "../../lib/knockout.viewmodel",
	        "shelby": "../../build/shelby"
	    },
	    
	    onError: function (err) {
	        console.log(err.requireType);
	        
	        if (err.requireType === "timeout") {
	            console.log("modules: " + err.requireModules);
	        }

	        throw err;
	    }
	});

	// Manually register Knockout library to use it as a global object for the knockout.viewmodel mapper
	// and as an ADM module. The Knockout library must be load before require.js to ensure that this is working.
	define("knockout", [], function() {
	    return ko;
	});

	define(function(require) {
	    var knockout = require("knockout");
        var shelby = require("shelby");

	    var ViewModel = shelby.ViewModel.extend({
	        message: knockout.observable("Bootstrapping Shelby with requireJS works!")
	    });

	    new ViewModel().bind();
	});
})();