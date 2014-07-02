(function($) {
    "use strict";

    describe("HttpViewModel.ctor", function() {
        it("Can create view model", function() {
            new Shelby.HttpViewModel();
        });
    });

    describe("HttpViewModel.all", function() {
        it("When using a REST endpoint and the \"url\" property is not a valid URL, throw an exception", function() {

        });

        it("When using an RPC endpoint and the \"url\" property is not an object having a property named \"all\" with a valid URL as a value, throw an exception", function() {

        });

        describe("When an \"beforeFetch\" handler is specified", function() {
            it("Always call the handler before sending the request", function() {

            });
        });

        it("", function() {

        });
    });

    describe("HttpViewModel.detail", function() {

    });

    describe("HttpViewModel.add", function() {

    });

    describe("HttpViewModel.update", function() {

    });

    describe("HttpViewModel.remove", function() {

    });
})(jQuery);