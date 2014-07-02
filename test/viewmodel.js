(function($) {
	"use strict";

	function createViewModel(additionalFunctions) {
		var baseModel = {
			prop1: ko.observable(dataSampler.generateString(10)),
			prop2: ko.observable(dataSampler.generateString(10)),
			nestedProp: {
				prop3: ko.observable(dataSampler.generateString(10)),
				prop4: ko.observable(dataSampler.generateString(10))
			},
			array: ko.observableArray([{
				prop5: ko.observable(dataSampler.generateString(10)),
				prop6: ko.observable(dataSampler.generateString(10))
			}])
		};

		return new Shelby.ViewModel.extend($.extend(baseModel, additionalFunctions));
	}

	describe("ViewModel.bind", function() {
		it("Always apply bindings", function() {

		});

		it("When a DOM element is specified, apply the bindings with that element as root", function() {

		});

		it("When a jQuery element is specified, apply the bindings with that element as root", function() {

		});
		
		it("Always return a jQuery promise", function() {
		});

		describe("When an \"beforeBind\" handler is specified", function() {
			it("Always call the handler before apply the bindings", function() {

			});

			it("When \"beforeBind\" returns \"true\", let the \"beforeBind\" handler apply the bindings", function() {

			});

			it("When \"beforeBind\" do not returns \"true\", apply the bindings after \"beforeBind\" returns", function() {

			});
		});

		it("When an \"afterBind\" handler is specified, call the \"afterBind\" handler after applying the bindings", function() {

		});
	});

	describe("ViewModel.dispose", function() {

	});
})(jQuery);