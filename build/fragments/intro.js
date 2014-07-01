(function(factory) {
    "use strict";
    
    if (typeof require === "function") {
        var instance = factory(require("jquery"), require("knockout"));

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
            "knockout"
        ], factory);
    } 
    else {
        var target = window || global;

        // Expose as a global object.
        window.Shelby = factory(window.jQuery, window.ko);
    }
})(function($, ko) {
    "use strict";