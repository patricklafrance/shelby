(function($, undefined) { 
	"use strict";
	
	describe("Shelby.extend", function() {
		var Original = null;

		beforeEach(function() {
			Original = function() {};

			Original.prototype = {
				originalProp: dataSampler.generateString(10),
				originalFct: $.noop
			};

			Original.extend = Shelby.extend;
		});

		it("Cannot be called without arguments", function() {
			expect(function() { Original.extend(); }).toThrow();
		});

		it("Cannot be called with null", function() {
			expect(function() { Original.extend(null); }).toThrow();
			expect(function() { Original.extend(undefined); }).toThrow();
		});

		it("Cannot be called with an argument that is not an object", function() {
			expect(function() { Original.extend(true); }).toThrow();
			expect(function() { Original.extend(1); }).toThrow();
			expect(function() { Original.extend(dataSampler.generateString(1)); }).toThrow();
			expect(function() { Original.extend($.noop); }).toThrow();
		});

		describe("Can extends", function() {
			describe("Object literals", function() {
				var Extended = null;

				beforeEach(function() {
					Extended = Original.extend({
						prop: dataSampler.generateString(10),
						fct: $.noop
					});
				});

				it("Extended object general properties are copied", function() {
					expect(hasProperty(Extended.prototype, "originalProp")).toBeTruthy();
				});

				it("Extended object function properties are copied", function() {
					expect(hasProperty(Extended.prototype, "originalFct")).toBeTruthy();
				});

				it("Object literal general properties are copied", function() {
					expect(hasProperty(Extended.prototype, "prop")).toBeTruthy();
				});

				it("Object literal function properties are copied", function() {
					expect(hasProperty(Extended.prototype, "fct")).toBeTruthy();
				});
			});

			describe("Deep object literals", function() {
				var Extended = null;

				beforeEach(function() {
					Extended = Original.extend({
						first: {
							second: {
								prop: dataSampler.generateString(10),
								fct: $.noop
							}
						}
					});
				});

				it("Deep general properties are copied", function() {
					expect(hasProperty(Extended.prototype, "first")).toBeTruthy();
					expect(hasProperty(Extended.prototype.first, "second")).toBeTruthy();
					expect(hasProperty(Extended.prototype.first.second, "prop")).toBeTruthy();
				});

				it("Deep function properties are copied", function() {
					expect(hasProperty(Extended.prototype, "first")).toBeTruthy();
					expect(hasProperty(Extended.prototype.first, "second")).toBeTruthy();
					expect(hasProperty(Extended.prototype.first.second, "fct")).toBeTruthy();
				});
			});

			describe("Prototyped objects", function() {
				var Extended = null;

				beforeEach(function() {
					var PrototypedObject = function() {};

					PrototypedObject.prototype = {
						prop: dataSampler.generateString(10),
						fct: $.noop
					};

					Extended = Original.extend(new PrototypedObject());
				});

				it("Extended object general properties are copied", function() {
					expect(hasProperty(Extended.prototype, "originalProp")).toBeTruthy();
				});

				it("Extended object function properties are copied", function() {
					expect(hasProperty(Extended.prototype, "originalFct")).toBeTruthy();
				});

				it("Object literal general properties are copied", function() {
					expect(hasProperty(Extended.prototype, "prop")).toBeTruthy();
				});

				it("Object literal function properties are copied", function() {
					expect(hasProperty(Extended.prototype, "fct")).toBeTruthy();
				});
			});
		});

		it("Do not modify the extended object prototype", function() {
			Original.extend({
				prop: dataSampler.generateString(10)
			});

			expect(hasProperty(Original.prototype, "prop")).toBeFalsy();
		});

		it("Can override the extended object properties and functions", function() {
			var Extended = Original.extend({
				originalProp: "Property override",
				originalFct: function() {
					return "Function override";
				}
			});

			expect(Extended.prototype.originalProp).toBe("Property override");
			expect(Extended.prototype.originalFct()).toBe("Function override");
		});

		it("Can merge multiple objects in one call", function() {
			var Extended = Original.extend(
				{ prop1: dataSampler.generateString(10) },
				{ prop2: dataSampler.generateString(10) },
				{ prop3: dataSampler.generateString(10) });

			expect(hasProperty(Extended.prototype, "prop1")).toBeTruthy();
			expect(hasProperty(Extended.prototype, "prop2")).toBeTruthy();
			expect(hasProperty(Extended.prototype, "prop3")).toBeTruthy();
		});

		it("Can extend the same object multiple times", function() {
			var FirstExtend = Original.extend({
				prop1: dataSampler.generateString(10),
				fct1: $.noop
			});
			
			var SecondExtend = FirstExtend.extend({
				prop2: dataSampler.generateString(10),
				fct2: $.noop
			});
			
			var ThirdExtend = SecondExtend.extend({
				prop1: "Property override",
				fct1: function() {
					return "Function override";
				}
			});

			expect(hasProperty(ThirdExtend.prototype, "originalProp")).toBeTruthy();
			expect(hasProperty(ThirdExtend.prototype, "originalFct")).toBeTruthy();
			expect(hasProperty(ThirdExtend.prototype, "fct1")).toBeTruthy();
			expect(hasProperty(ThirdExtend.prototype, "prop2")).toBeTruthy();
			expect(hasProperty(ThirdExtend.prototype, "fct2")).toBeTruthy();

			expect(ThirdExtend.prototype.prop1).toBe("Property override");
			expect(ThirdExtend.prototype.fct1()).toBe("Function override");
		});

		it("Resulting object can access parent prototype", function() {
			var FirstExtend = Original.extend({});
			var SecondExtend = FirstExtend.extend({});

			expect(areEquals(FirstExtend.prototype._super, Original.prototype)).toBeTruthy();
			expect(areEquals(SecondExtend.prototype._super, FirstExtend.prototype)).toBeTruthy();
		});

		it("Resulting object \"_initialize\" function is called with arguments when the object is instanciated", function() {
			var wasCalledWithArguments = false;

			var Extended = Original.extend({
				_initialize: function(args) {
					if (args === "Constructor arguments") {
						wasCalledWithArguments = true;
					}
				}
			});

			new Extended("Constructor arguments");

			expect(wasCalledWithArguments).toBeTruthy();
		});

		it("Extended object \"_initialize\" function is called on resulting and parent objects when defined", function() {
			var wasCalledForFirstExtend = false;
			var wasCalledForSecondExtend = false;

			var FirstExtend = Original.extend({
				_initialize: function() {
					wasCalledForFirstExtend = true;
				}
			});

			var SecondExtend = FirstExtend.extend({
				_initialize: function() {
					wasCalledForSecondExtend = true;
				}
			});

			new SecondExtend();

			expect(wasCalledForFirstExtend).toBeTruthy();
			expect(wasCalledForSecondExtend).toBeTruthy();
		});

		it("Resulting object of multiples extend \"_initialize\" function is only called once", function() {
			var callCount = 0;

			var FirstExtend = Original.extend({});
			var SecondExtend = FirstExtend.extend({});

			var ThirdExtend = SecondExtend.extend({
				_initialize: function() {
					callCount += 1;
				}
			});

			new ThirdExtend();

			expect(callCount).toBe(1);
		});

		it("Can call a parent overwrited property with \"_super\"", function() {

		});
	});
})(jQuery);