(function($, undefined) {
	"use strict";

	describe("Shelby.utilityExtender", function() {
		var model = null;

		describe("Shelby.utilityExtender.reset", function() {
			beforeEach(function() {
				model = {
					prop1: ko.observable(dataSampler.generateString(10)),
					prop2: ko.observable(dataSampler.generateString(10)),
					nestedProp: {
						prop3: ko.observable(dataSampler.generateString(10)),
						prop4: ko.observable(dataSampler.generateString(10))
					},
					arrayProp: ko.observableArray([{
						prop5: ko.observable(dataSampler.generateString(10)),
						prop6: ko.observable(dataSampler.generateString(10))
					}]),
					prop7: dataSampler.generateString(10),
					prop8: dataSampler.generateString(10)
				};

				Shelby.Components.propertyExtender().addExtenders(model, {
					"*": {
						"utility": Shelby.Components.extenderRegistry().getExtenders()["*"]["utility"]
					}
				});
			});

			it("When no parameters are specified, reset all the properties with \"null\"", function() {
				model.shelby.reset();

				expect(model.prop1.peek()).toBeNull();
				expect(model.prop2.peek()).toBeNull();
				expect(model.nestedProp.prop3.peek()).toBeNull();
				expect(model.nestedProp.prop4.peek()).toBeNull();
				expect(model.arrayProp.peek()[0].prop5.peek()).toBeNull();
				expect(model.arrayProp.peek()[0].prop6.peek()).toBeNull();
			});

			it("Can reset deep properties", function() {
				model.shelby.reset();

				expect(model.nestedProp.prop3.peek()).toBeNull();
				expect(model.nestedProp.prop4.peek()).toBeNull();
			});

			it("Can reset deep properties contained in array", function() {
				model.shelby.reset();

				expect(model.arrayProp.peek()[0].prop5.peek()).toBeNull();
				expect(model.arrayProp.peek()[0].prop6.peek()).toBeNull();
			});

			it("Never remove items from array", function() {
				model.shelby.reset();

				expect(model.arrayProp.peek().length).toBe(1);
			});

			it("When a reset value is specified, reset all the properties with the specified value", function() {
				var resetValue = dataSampler.generateString(10);

				model.shelby.reset(resetValue);

				expect(model.prop1.peek()).toBe(resetValue);
				expect(model.prop2.peek()).toBe(resetValue);
				expect(model.nestedProp.prop3.peek()).toBe(resetValue);
				expect(model.nestedProp.prop4.peek()).toBe(resetValue);
				expect(model.arrayProp.peek()[0].prop5.peek()).toBe(resetValue);
				expect(model.arrayProp.peek()[0].prop6.peek()).toBe(resetValue);
			});

			it("When options are specified, reset the matching properties with the matching values", function() {
				var options = {
					"{root}.prop1": dataSampler.generateString(10),
					"{root}.prop2": dataSampler.generateString(10),
					"{root}.nestedProp.prop3": dataSampler.generateString(10),
					"{root}.nestedProp.prop4": dataSampler.generateString(10),
					"{root}.arrayProp[i].prop5": dataSampler.generateString(10),
					"{root}.arrayProp[i].prop6": dataSampler.generateString(10)
				};

				model.shelby.reset(options);

				expect(model.prop1.peek()).toBe(options["{root}.prop1"]);
				expect(model.prop2.peek()).toBe(options["{root}.prop2"]);
				expect(model.nestedProp.prop3.peek()).toBe(options["{root}.nestedProp.prop3"]);
				expect(model.nestedProp.prop4.peek()).toBe(options["{root}.nestedProp.prop4"]);
				expect(model.arrayProp.peek()[0].prop5.peek()).toBe(options["{root}.arrayProp[i].prop5"]);
				expect(model.arrayProp.peek()[0].prop6.peek()).toBe(options["{root}.arrayProp[i].prop6"]);
			});

			it("When a reset value and options are specified, use the options value when specified, otherwise use the reset value", function() {
				var resetValue = dataSampler.generateString(10);
				var options = {
					"{root}.prop1": dataSampler.generateString(10),
					"{root}.nestedProp.prop3": dataSampler.generateString(10)
				};

				model.shelby.reset(resetValue, options);

				expect(model.prop1.peek()).toBe(options["{root}.prop1"]);
				expect(model.prop2.peek()).toBe(resetValue);
				expect(model.nestedProp.prop3.peek()).toBe(options["{root}.nestedProp.prop3"]);
				expect(model.nestedProp.prop4.peek()).toBe(resetValue);
				expect(model.arrayProp.peek()[0].prop5.peek()).toBe(resetValue);
				expect(model.arrayProp.peek()[0].prop6.peek()).toBe(resetValue);
			});
		});

		describe("Shelby.utilityExtender.updateFrom", function() {
			it("When the source is not an object, throw an exception", function() {
				expect(function() { model.shelby.updateFrom(null); }).toThrow();
				expect(function() { model.shelby.updateFrom(undefined); }).toThrow();
				expect(function() { model.shelby.updateFrom(3); }).toThrow();
				expect(function() { model.shelby.updateFrom(""); }).toThrow();
				expect(function() { model.shelby.updateFrom([]); }).toThrow();
			});

			describe("When target properties are observables", function() {
				beforeEach(function() {
					model = {
						prop1: dataSampler.generateString(10),
						prop2: dataSampler.generateString(10),
						nestedProp: {
							prop3: dataSampler.generateString(10),
							prop4: dataSampler.generateString(10)
						},
						arrayProp: ko.observableArray[{
							prop5: dataSampler.generateString(10),
							prop6: dataSampler.generateString(10)
						}]
					};

					// The updateFrom utility expect that the observables has been map and
					// by the shelby mapper. 
					model = Shelby.Components.mapper().fromJS(model);

					Shelby.Components.propertyExtender().addExtenders(model, {
						"*": {
							"utility": Shelby.Components.extenderRegistry().getExtenders()["*"]["utility"]
						}
					});
				});

				it("Can update first level properties", function() {
					var source = {
						prop1: "Prop1 updated value",
						prop2: "Prop2 updated value"
					};

					model.shelby.updateFrom(source);

					expect(model.prop1.peek()).toBe(source.prop1);
					expect(model.prop2.peek()).toBe(source.prop2);
				});

				it("Can update nested properties", function() {
					var source = {
						nestedProp: {
							prop3: "Prop3 updated value",
							prop4: "Prop4 updated value"
						}
					};

					model.shelby.updateFrom(source);

					expect(model.nestedProp.prop3.peek()).toBe(source.nestedProp.prop3);
					expect(model.nestedProp.prop4.peek()).toBe(source.nestedProp.prop4);
				});

				it("Can update array properties", function() {
					var source = {
						arrayProp: [{
							prop5: "Prop5 updated value",
							prop6: "Prop6 updated value"
						}, "Added item when updating"]
					};

					model.shelby.updateFrom(source);

					expect(model.arrayProp.peek()[0].prop5).toBe(source.arrayProp[0].prop5);
					expect(model.arrayProp.peek()[0].prop6).toBe(source.arrayProp[0].prop6);
					expect(model.arrayProp.peek().length).toBe(2);	
				});
			});

			describe("When target properties are raw JavaScript", function() {
				beforeEach(function() {
					model = {
						prop1: dataSampler.generateString(10),
						prop2: dataSampler.generateString(10),
						nestedProp: {
							prop3: dataSampler.generateString(10),
							prop4: dataSampler.generateString(10)
						},
						arrayProp: ko.observableArray[{
							prop5: dataSampler.generateString(10),
							prop6: dataSampler.generateString(10)
						}]
					};

					Shelby.Components.propertyExtender().addExtenders(model, {
						"*": {
							"utility": Shelby.Components.extenderRegistry().getExtenders()["*"]["utility"]
						}
					});
				});

				it("Can update first level properties", function() {
					var source = {
						prop1: "Prop1 updated value",
						prop2: "Prop12 updated value"
					};

					model.shelby.updateFrom(source);

					expect(model.prop1).toBe(source.prop1);
					expect(model.prop2).toBe(source.prop2);
				});

				it("Can update nested properties", function() {
					var source = {
						nestedProp: {
							prop3: "Prop3 updated value",
							prop4: "Prop4 updated value"
						}
					};

					model.shelby.updateFrom(source);

					expect(model.nestedProp.prop3).toBe(source.nestedProp.prop3);
					expect(model.nestedProp.prop4).toBe(source.nestedProp.prop4);
				});

				it("Can update array properties", function() {
					var source = {
						arrayProp: [{
							prop5: "Prop5 updated value",
							prop6: "Prop6 updated value"
						}, "Added item when updating"]
					}
					model.shelby.updateFrom(source);

					expect(model.arrayProp[0].prop5).toBe(source.arrayProp[0].prop5);
					expect(model.arrayProp[0].prop6).toBe(source.arrayProp[0].prop6);
					expect(model.arrayProp.length).toBe(2);					
				});
			});
		});
	});
})(jQuery);