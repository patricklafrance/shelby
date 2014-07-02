(function(factory) {
    "use strict";
    
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        var instance = factory(require("jquery"), require("knockout"), require("knockout.viewmodel"));

        // CommonJS
        if (typeof exports === "object") {
            exports = instance;
        }

        // Node.js and Browserify
        if (typeof module === "object") {
            module.exports = instance;
        }
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
        var target = window || global;

        // Expose as a global object.
        target.Shelby = factory(target.jQuery, target.ko, target.ko.viewmodel);
    }
})(function($, ko, koViewModel) {
    "use strict";