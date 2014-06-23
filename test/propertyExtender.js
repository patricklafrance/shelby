(function($) {
	"use strict";
	
	describe("PropertyExtender.add", function() {
		var propertyExtender = null;

		beforeEach(function() {
			propertyExtender = new Shelby.PropertyExtender();
		});

		it("When target is null, throw an exception", function() {
			expect(function() { propertyExtender.add(null, {}); }).toThrow();
			expect(function() { propertyExtender.add(undefined, {}); }).toThrow();
		});

		it("When extenders is null, throw an exception", function() {
			expect(function() { propertyExtender.add({}, null); }).toThrow();
			expect(function() { propertyExtender.add({}, undefined); }).toThrow();
		});

		it("Always create a shelby namespace on objects and observables properties", function() {
			var obj = {
				prop: ko.observable(dataSampler.generateString(5))
			};

			propertyExtender.add(obj, {});

			expect($.isPlainObject(obj[Shelby.NAMESPACE])).toBeTruthy();
			expect($.isPlainObject(obj.prop[Shelby.NAMESPACE])).toBeTruthy();
		});

		describe("Extenders type parameter always match the property type", function() {
			it("When object", function() {
				var works = false;
				var obj = {};

				propertyExtender.add(obj, {
					"*": {
						extender: function(target, type) {
							works = type === Shelby.PropertyType.Object;
						}
					}
				});

				expect(works).toBeTruthy();
			});

			it("When array", function() {
				var works = false;

				var obj = {
					array: ko.observableArray([])
				};
				
				propertyExtender.add(obj, {
					"/array": {
						extender: function(target, type) {
							works = type === Shelby.PropertyType.Array;
						}
					}
				});

				expect(works).toBeTruthy();
			});

			it("When scalar", function() {
				var works = false;

				var obj = {
					obs: ko.observable(dataSampler.generateString(5))
				};

				propertyExtender.add(obj, {
					"/obs": {
						extender: function(target, type) {
							works = type === Shelby.PropertyType.Array;
						}
					}
				});
			});
		});

		it("When an object has already been extended, do not apply the extenders", function() {
			var obj = {
				prop: ko.observable(dataSampler.generateString(5))
			};

			propertyExtender.add(obj, {
				"*": {
					extender: function(target) {
						target[Shelby.NAMESPACE].fct1 = $.noop;
					}
				}
			});

			propertyExtender.add(obj, {
				"*": {
					extender: function(target) {
						target[Shelby.NAMESPACE].fct2 = $.noop;
					}
				}
			});

			expect($.isPlainObject(obj[Shelby.NAMESPACE])).toBeTruthy();
			expect($.isFunction(obj[Shelby.NAMESPACE].fct1)).toBeTruthy();
			expect($.isFunction(obj.prop[Shelby.NAMESPACE].fct1)).toBeTruthy();
			expect($.isFunction(obj[Shelby.NAMESPACE].fct2)).toBeFalsy();
			expect($.isFunction(obj.prop[Shelby.NAMESPACE].fct2)).toBeFalsy();
		});

		it("Extend all properties that are observables, ignore all other property types", function() {
			var obj = {
				obsProp: ko.observable(dataSampler.generateString(5)),
				intProp: dataSampler.generateInteger(5),
				strProp: dataSampler.generateString(5),
				fctProp: $.noop,
				boolProp: true
			};

			propertyExtender.add(obj, {
				"*": {
					extender: function(target) {
						target[Shelby.NAMESPACE].fct1 = $.noop;
					}
				}
			});

			expect($.isPlainObject(obj.obsProp[Shelby.NAMESPACE])).toBeTruthy();
			expect($.isFunction(obj.obsProp[Shelby.NAMESPACE].fct1)).toBeTruthy();
			expect($.isPlainObject(obj.intProp[Shelby.NAMESPACE])).toBeFalsy();
			expect($.isPlainObject(obj.strProp,[Shelby.NAMESPACE])).toBeFalsy();
			expect($.isPlainObject(obj.fctProp[Shelby.NAMESPACE])).toBeFalsy();
			expect($.isPlainObject(obj.boolProp[Shelby.NAMESPACE])).toBeFalsy();
		});

		it("Extend deep properties", function() {
			var obj = {
				nested1: {
					nested2: {
						prop: ko.observable(dataSampler.generateString(5))
					}
				}
			};

			propertyExtender.add(obj, {
				"*": {
					extender: function(target) {
						target[Shelby.NAMESPACE].fct1 = $.noop;
					}
				}
			});

			expect($.isPlainObject(obj[Shelby.NAMESPACE])).toBeTruthy();
			expect($.isPlainObject(obj.nested1[Shelby.NAMESPACE])).toBeTruthy();
			expect($.isPlainObject(obj.nested1.nested2[Shelby.NAMESPACE])).toBeTruthy();
			expect($.isFunction(obj.nested1.nested2.prop[Shelby.NAMESPACE].fct1)).toBeTruthy();
		});

		it("Wildcard extenders are applied to all the observable properties", function() {
			var obj = {
				prop1: ko.observable(dataSampler.generateString(5)),
				prop2: ko.observable(dataSampler.generateString(5))
			};

			propertyExtender.add(obj, {
				"*": {
					extender1: function(target) {
						target[Shelby.NAMESPACE].fct1 = $.noop;
					},
					extender2: function(target) {
						target[Shelby.NAMESPACE].fct2 = $.noop;
					}
				}
			});

			expect($.isFunction(obj.prop1[Shelby.NAMESPACE].fct1)).toBeTruthy();
			expect($.isFunction(obj.prop2[Shelby.NAMESPACE].fct2)).toBeTruthy();
			expect($.isFunction(obj.prop1[Shelby.NAMESPACE].fct1)).toBeTruthy();
			expect($.isFunction(obj.prop2[Shelby.NAMESPACE].fct2)).toBeTruthy();
		});

		it("Specific extenders are applied only when the property path match", function() {
			var obj = {
				prop1: ko.observable(dataSampler.generateString(5)),
				prop2: ko.observable(dataSampler.generateString(5))
			};

			propertyExtender.add(obj, {
				"/prop2": {
					extender: function(target) {
						target[Shelby.NAMESPACE].fct1 = $.noop;
					}
				}
			});

			expect($.isFunction(obj.prop1[Shelby.NAMESPACE].fct1)).toBeFalsy();
			expect($.isFunction(obj.prop2[Shelby.NAMESPACE].fct1)).toBeTruthy();
		});

		it("When wildcard and specific extenders are bot specified, they are all applied", function() {
			var obj = {
				prop1: ko.observable(dataSampler.generateString(5)),
				prop2: ko.observable(dataSampler.generateString(5))
			};

			propertyExtender.add(obj, {
				"*": {
					extender1: function(target) {
						target[Shelby.NAMESPACE].fct1 = $.noop;
					}
				},
				"/prop2": {
					extender2: function(target) {
						target[Shelby.NAMESPACE].fct2 = $.noop;
					}
				}
			});

			expect($.isFunction(obj.prop1[Shelby.NAMESPACE].fct1)).toBeTruthy();
			expect($.isFunction(obj.prop2[Shelby.NAMESPACE].fct1)).toBeTruthy();
			expect($.isFunction(obj.prop2[Shelby.NAMESPACE].fct2)).toBeTruthy();
		});
	});

	describe("PropertyExtender.remove", function() {
		var propertyExtender = null;

		beforeEach(function() {
			propertyExtender = new Shelby.PropertyExtender();
		});

		it("When target is null, throw an exception", function() {
			expect(function() { propertyExtender.remove(null); }).toThrow();
			expect(function() { propertyExtender.remove(undefined); }).toThrow();
		});

		it("When a property has not been extended, do nothing", function() {
			var obj = {
				prop: ko.observable("prop value")
			};

			expect(function() { propertyExtender.remove(obj); }).not.toThrow();
			expect(obj.prop.peek()).toBe("prop value");
		});

		it("When a property is not an observable, do nothing", function() {
			var obj = {
				prop: "prop value"
			};

			expect(function() { propertyExtender.remove(obj); }).not.toThrow();
			expect(obj.prop).toBe("prop value");			
		});

		it("Remove extenders of all the extended properties", function() {
			var obj = {
				prop1: ko.observable(dataSampler.generateString(5)),
				nested1: {
					nested2: {
						prop2: ko.observableArray([])
					}
				}
			};

			propertyExtender.add(obj, {});
			propertyExtender.remove(obj);

			expect($.isPlainObject(obj[Shelby.NAMESPACE])).toBeFalsy();
			expect($.isPlainObject(obj.prop1[Shelby.NAMESPACE])).toBeFalsy();
			expect($.isPlainObject(obj.nested1[Shelby.NAMESPACE])).toBeFalsy();
			expect($.isPlainObject(obj.nested1.nested2[Shelby.NAMESPACE])).toBeFalsy();
			expect($.isPlainObject(obj.nested1.nested2.prop2[Shelby.NAMESPACE])).toBeFalsy();
		});
	});
})(jQuery);