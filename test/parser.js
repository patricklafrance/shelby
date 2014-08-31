(function($) {
	"use strict";
	
	describe("Parser.parse", function() {
		var parser = null,
			mapper = null;

		beforeEach(function() {
			parser = new Shelby.Parser();
			mapper = new Shelby.Mapper();
		});	

		it("When the object parameter is null, throw an exception", function() {
			expect(function() { parser.parse(null); }).toThrow();
		});

		it("When the options parameter is null, continue", function() {
			parser.parse({}, null);
		});

		describe("Path", function() {
			var obj = null;

			beforeEach(function() {
				obj = {
					observableArrayProp: ko.observableArray([
						dataSampler.generateString(5), 
						dataSampler.generateString(5), 
						{
							innerArrayProp: [dataSampler.generateString(5)]
						}
					]),
					objProp: {
						prop1: dataSampler.generateString(5),
						observableProp: ko.observable(dataSampler.generateString(5))
					},
					fctProp: $.noop,
					intProp: dataSampler.generateInteger(5),
					strProp: dataSampler.generateString(5)
				};
			});

			it("Always starts with {root}", function() {
				var count = 0;

				parser.parse(obj, {
					onPrimitive: function(args) {
						if (args.path.indexOf("{root}") === 0) {
							count += 1;
						}
					}
				});

				expect(count > 0).toBeTruthy();
			});

			it("Nested object are separated by '.'", function() {
				var count = 0;

				parser.parse(obj, {
					onPrimitive: function(args) {
						if (args.path === "{root}.objProp.prop1") {
							count += 1;
						}
					}
				});

				expect(count).toBe(1);
			});

			it("Array are represented by [i]", function() {
				var count = 0;

				parser.parse(obj, {
					onPrimitive: function(args) {
						if (args.path === "{root}.observableArrayProp[i]") {
							count += 1;
						}
						else if (args.path === "{root}.observableArrayProp[i].innerArrayProp") {
							count += 1;
						}
					}
				});

				expect(count).toBe(2);
			})
		});

		describe("Handlers", function() {
			var obj = null;

			beforeEach(function() {
				obj = {
					observableArrayProp: ko.observableArray([
						dataSampler.generateString(5), 
						dataSampler.generateString(5), 
						{
							innerArrayProp: [dataSampler.generateString(5)]
						}
					]),
					objProp: {
						prop1: dataSampler.generateString(5),
						observableProp: ko.observable(dataSampler.generateString(5))
					},
					fctProp: $.noop,
					intProp: dataSampler.generateInteger(5),
					strProp: dataSampler.generateString(5)
				};
			});

			it("When provided, the array handler is always called when a property having a value of the array type is parsed", function() {
				var count = 0;

				parser.parse(obj, {
					onArray: function() {
						count += 1;
					}
				});

				expect(count).toBe(2);
			});

			it("When provided, the object handler is always called when a property having a value of the object type is parsed", function() {
				var count = 0;

				parser.parse(obj, {
					onObject: function() {
						count += 1;
					}
				});

				// Result is 3 because of the original object count for one.
				expect(count).toBe(3);
			});

			it("When provided, the function handler is always called when a property having a value of the function type is parsed", function() {
				var count = 0;

				parser.parse(obj, {
					onFunction: function() {
						count += 1;
					}
				});

				// Result is 2 because of the observable property.
				expect(count).toBe(2);
			});

			it("When provided, the primitive handler is always called when a property having any other types is parsed", function() {
				var count = 0;

				parser.parse(obj, {
					onPrimitive: function() {
						count += 1;
					}
				});

				expect(count).toBe(6);
			});

			// it("When an object handler or any of his children properties handlers return false, all the children properties of the object that have not been parsed are ignored", function() {
			// 	var count = 0;

			// 	parser.parse(obj, {
			// 		onObject: function(args) {
			// 			if (args.key === "objProp") {
			// 				return false;
			// 			}
			// 		},
			// 		onPrimitive: function() {
			// 			count += 1;
			// 		}
			// 	});

			// 	expect(count).toBe(5);
			// });

			// it("When an array handler or any of his items handlers return false, all the items properties of the array that have not been parsed are ignored", function() {

			// });

			describe("Arguments passed to an handler always contains", function() {
				it("The property key", function() {
					var works = false;

					parser.parse(obj, {
						onArray: function(args) {
							if (args.key === "observableArrayProp") {
								works = true;
							}
						}
					});

					expect(works).toBeTruthy();
				});

				it("The property value", function() {
					var works = false;

					parser.parse(obj, {
						onArray: function(args) {
							if (args.key === "observableArrayProp" && areEquals(obj.observableArrayProp, args.value)) {
								works = true;
							}
						}
					});

					expect(works).toBeTruthy();
				});

				it("The property path", function() {
					var works = false;

					parser.parse(obj, {
						onArray: function(args) {
							if (args.key === "observableArrayProp" && args.path === "{root}.observableArrayProp") {
								works = true;
							}
						}
					});

					expect(works).toBeTruthy();				
				});

				it("The parent of the property", function() {
					var works = false;

					parser.parse(obj, {
						onArray: function(args) {
							if (args.key === "observableArrayProp" && areEquals(obj, args.parent)) {
								works = true;
							}
						}
					});

					expect(works).toBeTruthy();						
				});

				it("The original object being parsed", function() {
					var works = false;

					parser.parse(obj, {
						onArray: function(args) {
							if (args.key === "observableArrayProp" && areEquals(obj, args.obj)) {
								works = true;
							}
						}
					});

					expect(works).toBeTruthy();	
				});
			});

			it("When provided, the context object is always set as the context of the function when calling an handler", function() {
				var works = false;

				var context = {
					prop: dataSampler.generateString(5)
				};

				parser.parse(obj, {
					onArray: function(args) {
						if (args.key === "observableArrayProp" && areEquals(context, this)) {
							works = true;
						}
					}
				}, context);

				expect(works).toBeTruthy();	
			});

			it("When provided, the properties of the object that are not matching the filter are ignored", function() {
				var works = true;

				parser.parse(obj, {
					onArray: function() {
						works = false;
					},
					filter: function(key, value, path) {
		                value = ko.utils.peekObservable(value);
		            
		                return !$.isArray(value);
					}
				});

				expect(works).toBeTruthy();	
			});
		});

		it("Never modifiy original object", function() {
			var obj = {};

			parser.parse(obj);

			expect(keys(obj).length).toBe(0);
		});

		it("Never modify original options object.", function() {
			var options = {};

			parser.parse({}, options);

			expect(keys(options).length).toBe(0);
		});
	});
})(jQuery);