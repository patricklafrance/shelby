(function($, undefined) {
	"use strict";

	describe("Ajax.send", function() {
		var ajax = null,
			options = null;

		beforeEach(function() {
			ajax = new Shelby.Ajax();

			options = {
				url: dataSampler.generateString(10),
				type: dataSampler.generateString(10)
			};
		});

		it("When \"options\" are null, throw an exception", function() {
			expect(function() { ajax.send(null); }).toThrow();
			expect(function() { ajax.send(); }).toThrow();
		});

		it("When \"options.url\" is null or empty, throw an exception", function() {
			expect(function() { ajax.send({ type: dataSampler.generateString(10) }); }).toThrow();
			expect(function() { ajax.send({ url: undefined, type: dataSampler.generateString(10) }); }).toThrow();
			expect(function() { ajax.send({ url: null, type: dataSampler.generateString(10) }); }).toThrow();
			expect(function() { ajax.send({ url: "", type: dataSampler.generateString(10) }); }).toThrow();
		});

		it("When \"options.type\" is null or empty, throw an exception", function() {
			expect(function() { ajax.send({ url: dataSampler.generateString(10) }); }).toThrow();
			expect(function() { ajax.send({ url: dataSampler.generateString(10), type: undefined }); }).toThrow();
			expect(function() { ajax.send({ url: dataSampler.generateString(10), type: null }); }).toThrow();
			expect(function() { ajax.send({ url: dataSampler.generateString(10), type: "" }); }).toThrow();
		});

		it("When \"options.cache\" option is not specified, default \"cache\" option to \"false\"", function() {
			spyOn($, "ajax");

			ajax.send({ 
				url: dataSampler.generateString(10), 
				type: dataSampler.generateString(10)
		 	});

			expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({cache: false}));
		});

		it("When request has data and the \"options.contentType\" option is not specified, default \"contentType\" option to \"application/json\"", function() {
			spyOn($, "ajax");

			ajax.send({ 
				url: dataSampler.generateString(10), 
				type: dataSampler.generateString(10),
				data: {
					prop1: dataSampler.generateString(10)
				}
		 	});

			expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({contentType: "application/json"}));
		});

		it("When request do not have data and the \"options.contentType\" options is not specified, set \"contentType\" option to null", function() {
			spyOn($, "ajax");

			ajax.send({ 
				url: dataSampler.generateString(10), 
				type: dataSampler.generateString(10)
		 	});

			expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({contentType: null}));
		});

		it("When request has data and the \"options.contentType\" option is \"application/json\", serialize the data to the JSON format", function() {
			spyOn($, "ajax");

			var data = {
				prop1: dataSampler.generateString(10)
			};

			ajax.send({ 
				url: dataSampler.generateString(10), 
				type: dataSampler.generateString(10),
				data: data
		 	});

			expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({contentType: "application/json", data: JSON.stringify(data) }));
		});

		it("Always use the specified URL", function() {
			spyOn($, "ajax");

			var url = dataSampler.generateString(10);

			ajax.send({ 
				url: url, 
				type: dataSampler.generateString(10)
		 	});

			expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({url: url}));
		});

		it("Always use the HTTP verb matching the specified request type", function() {
			spyOn($, "ajax");

			var type = dataSampler.generateString(10);

			ajax.send({ 
				url: dataSampler.generateString(10), 
				type: type
		 	});

			expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({type: type}));
		});

		it("Always send the request", function() {
			spyOn($, "ajax");

			ajax.send({ 
				url: dataSampler.generateString(10), 
				type: dataSampler.generateString(10)
		 	});

			expect($.ajax).toHaveBeenCalled();
		});
	});
})(jQuery);