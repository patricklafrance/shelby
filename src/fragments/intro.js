(function(factory) {
    "use strict";
    
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        var target = module.exports || exports;

        // "knockout.viewmodel" is not available as Node.js package or CommonJS module.
        target = function(koViewModel) {
            if (!koViewModel) {
                throw new Error("A valid instance of the \"knockout viewmodel\" plugin must be provided.");
            }

            return factory(require("jquery"), require("knockout"), koViewModel);
        };
    }
    else if (typeof define === "function" && define.amd) {
        // Register as a named AMD module.
        define("shelby", [
            "jquery",
            "knockout",
            "knockout.viewmodel"
        ], factory);
    } 
    else {
        // Expose as a global object.
        window.Shelby = factory(window.jQuery, window.ko, window.ko.viewmodel);
    }
})(function($, ko, koViewModel) {
    "use strict";