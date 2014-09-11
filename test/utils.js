(function($, utils, undefined) { 
    "use strict";
    
    describe("Utils.isUndefined", function() {
        it("Return true when the value is undefined", function() {
            expect(utils.isUndefined(undefined)).toBeTruthy();
        });

        it("Return false when the value is null", function() {
            expect(utils.isUndefined(null)).toBeFalsy();
        });

        it("Return false when the value is a not undefined", function() {
            expect(utils.isUndefined({})).toBeFalsy();
            expect(utils.isUndefined(true)).toBeFalsy();
            expect(utils.isUndefined(dataSampler.generateInteger(5))).toBeFalsy();
            expect(utils.isUndefined(dataSampler.generateString(1))).toBeFalsy();
            expect(utils.isUndefined($.noop)).toBeFalsy();
        });
    });

    describe("Utils.isNull", function() {
        it("Return true when the value is undefined", function() {
            expect(utils.isNull(undefined)).toBeTruthy();
        });

        it("Return true when the value is null", function() {
            expect(utils.isNull(null)).toBeTruthy();
        });

        it("Return false when the value is not null or undefined", function() {
            expect(utils.isUndefined({})).toBeFalsy();
            expect(utils.isNull(true)).toBeFalsy();
            expect(utils.isNull(dataSampler.generateInteger(5))).toBeFalsy();
            expect(utils.isNull(dataSampler.generateString(1))).toBeFalsy();
            expect(utils.isNull($.noop)).toBeFalsy();
        });
    });

    describe("Utils.isNullOrEmpty", function() {
        it("Return true when the value is undefined", function() {
            expect(utils.isNullOrEmpty(undefined)).toBeTruthy();
        });

        it("Return true when the value is null", function() {
            expect(utils.isNullOrEmpty(null)).toBeTruthy();
        });

        it("Return true when the value is an empty string", function() {
            expect(utils.isNullOrEmpty("")).toBeTruthy();
        });

        it("Return false when the value is a non null, undefined or empty string", function() {
            expect(utils.isUndefined({})).toBeFalsy();
            expect(utils.isNull(true)).toBeFalsy();
            expect(utils.isNull(dataSampler.generateInteger(5))).toBeFalsy();
            expect(utils.isNull(dataSampler.generateString(1))).toBeFalsy();
            expect(utils.isNull($.noop)).toBeFalsy();
        });
    });

    describe("Utils.isString", function() {
        it("Return true when the value is a string", function() {
            expect(utils.isString("")).toBeTruthy();
        });

        it("Return false when the value is not a string", function() {
            expect(utils.isString({})).toBeFalsy();
            expect(utils.isString(true)).toBeFalsy();
            expect(utils.isString(dataSampler.generateInteger(5))).toBeFalsy();
            expect(utils.isString($.noop)).toBeFalsy();
            expect(utils.isString(null)).toBeFalsy();
            expect(utils.isString(undefined)).toBeFalsy();
        });
    });

    describe("Utils.isObject", function() {
        it("Return true when the value is an object literal", function() {
            expect(utils.isObject({})).toBeTruthy();
        });

        it("Return true when the value is a prototype object", function() {
            var PrototypedObject = function() {};
            PrototypedObject.prototype = {};

            expect(utils.isObject(new PrototypedObject())).toBeTruthy();
        });

        it("Return false when the value is not an object", function() {
            expect(utils.isObject(dataSampler.generateString(1))).toBeFalsy();
            expect(utils.isObject(true)).toBeFalsy();
            expect(utils.isObject(dataSampler.generateInteger(5))).toBeFalsy();
            expect(utils.isObject($.noop)).toBeFalsy();
            expect(utils.isObject(null)).toBeFalsy();
            expect(utils.isObject(undefined)).toBeFalsy();
        });
    });

    describe("Utils.isjQueryElement", function() {
        beforeEach(function() {
            $("<div/>").addClass("test").appendTo($("body"));
        });

        afterEach(function() {
            $(".test").remove();
        });

        it("When is a jQuery element, returns true", function() {
            expect(utils.isjQueryElement($(".test"))).toBeTruthy();
        });

        it("When is not a jQuery element, returns false", function() {
            expect(utils.isjQueryElement($(".test")[0])).toBeFalsy();
            expect(utils.isjQueryElement(dataSampler.generateString(1))).toBeFalsy();
            expect(utils.isjQueryElement(true)).toBeFalsy();
            expect(utils.isjQueryElement(dataSampler.generateInteger(5))).toBeFalsy();
            expect(utils.isjQueryElement($.noop)).toBeFalsy();
            expect(utils.isjQueryElement(null)).toBeFalsy();
            expect(utils.isjQueryElement(undefined)).toBeFalsy();
        });
    });

    describe("Utils.isDomElement", function() {
        beforeEach(function() {
            $("<div/>").addClass("test").appendTo($("body"));
        });

        afterEach(function() {
            $(".test").remove();
        });

        it("When is a DOM element, returns true", function() {
            expect(utils.isDomElement($(".test")[0])).toBeTruthy();
        });

        it("When is not a DOM element, return false", function() {
            expect(utils.isDomElement($(".test"))).toBeFalsy();
            expect(utils.isDomElement(dataSampler.generateString(1))).toBeFalsy();
            expect(utils.isDomElement(true)).toBeFalsy();
            expect(utils.isDomElement(dataSampler.generateInteger(5))).toBeFalsy();
            expect(utils.isDomElement($.noop)).toBeFalsy();
            expect(utils.isDomElement(null)).toBeFalsy();
            expect(utils.isDomElement(undefined)).toBeFalsy();
        });
    })

    describe("Utils.hasOwnProperty", function() {
        var obj = {
            prop: true
        };

        it("When the specified property is a direct property of the object, returns true", function() {
            expect(utils.hasOwnProperty(obj, "prop")).toBeTruthy();
        });

        it("When the specified property is not a direct property of the object, returns false", function() {
            expect(utils.hasOwnProperty(obj, "toString")).toBeFalsy();
        });
    });

    describe("Utils.hasProperty", function() {
        var obj = {
            prop: true
        };

        it("When the specified property is a direct property of the object, returns true", function() {
            expect(utils.hasProperty(obj, "prop")).toBeTruthy();
        });

        it("When the specified property is not a direct property of the object, returns true", function() {
            expect(utils.hasProperty(obj, "toString")).toBeTruthy();
        });
    });

    describe("Utils.clonePlainObject", function() {
        var original = null,
            clone = null;

        beforeEach(function() {
            original = {
                str: "Original value",
                integer: 1,
                bool: true,
                fct: function() {
                    return "Original value"
                },
                array: ["Original value 1", "Original value 2"],
                nested1: {
                    nested2: {
                        str: "Original value"
                    }
                }
            };

            clone = utils.clonePlainObject(original);
        });

        it("Primitive properties are cloned", function() {
            clone.str = "Clone value";
            clone.integer = 2;
            clone.bool = false;
            clone.fct = function() {
                return "Clone value";
            };

            expect(original.str).toBe("Original value");
            expect(original.integer).toBe(1);
            expect(original.bool).toBeTruthy();
            expect(original.fct()).toBe("Original value");
        });

        it("Array properties are cloned", function() {
            clone.array[0] = "Clone value 1";
            clone.array[1] = "Clone value 2";

            expect(original.array[0]).toBe("Original value 1");
            expect(original.array[1]).toBe("Original value 2");
        });

        it("Nested properties are cloned", function() {
            clone.nested1.nested2.str = "Update value";

            expect(original.nested1.nested2.str).toBe("Original value");
        });
    });

    describe("Utils.cloneArray", function() {
        var original = null,
            clone = null;

        beforeEach(function() {
            original = ["Original value 1", "Original value 2"];
            clone = utils.cloneArray(original);
        });

        it("Current values are cloned", function() {
            clone[0] = "Clone value 1";
            clone[1] = "Clone value 2";

            expect(original[0]).toBe("Original value 1");
            expect(original[1]).toBe("Original value 2");
        });

        it("Values added on clone are not added to the original array", function() {
            clone.push("Clone value 1");

            expect(original.length).toBe(2);
        });

        it("Values removed from clone are not removed from the original array", function() {
            clone.pop();

            expect(original.length).toBe(2);
        });
    });

    describe("Utils.arrayIndexOf", function() {
        describe("Without comparer", function() {
            var array = [0, 1, 1, 2, 3, 5];

            it("When the value is the first, returns 0", function() {
                expect(utils.arrayIndexOf(array, 0)).toBe(0);
            });

            it("When the value is the last, returns last index", function() {
                expect(utils.arrayIndexOf(array, 5)).toBe(array.length - 1);
            });

            it("When there is multiple occurence of the value, returns the first occurence index", function() {
                expect(utils.arrayIndexOf(array, 1)).toBe(1);
            });

            it("When the value is not in the array, returns -1", function() {
                expect(utils.arrayIndexOf(array, 9)).toBe(-1);
            });
        });

        describe("With comparer", function() {
            var array = [{ key: "Key of 1", value: 1 }, { key: "Key of 2", value: 2 }, { key: "Key of 3", value: 3 }];

            var comparer = function(current, target) {
                return current.key === target;
            };

            it("When the value is in the array, returns the value index", function() {
                expect(utils.arrayIndexOf(array, "Key of 2", comparer)).toBe(1);
            });

            it("When the value is not in the array, returns -1", function() {
                expect(utils.arrayIndexOf(array, dataSampler.generateString(10), comparer)).toBe(-1);
            });
        });
    });

    describe("Utils.arrayGetValue", function() {
        var complexValue = { key: "Key of 2", value: 2 },
            array = [{ key: "Key of 1", value: 1 }, complexValue, { key: "Key of 3", value: 3 }];

        var comparer = function(current, target) {
            return current.key === target;
        };

        it("When the value is in the array, returns the value", function() {
            var value = utils.arrayGetValue(array, "Key of 2", comparer);

            expect(areEquals(complexValue, value)).toBeTruthy();
        });

        it("When the value is not in the array, returns null", function() {
            expect(utils.arrayGetValue(array, dataSampler.generateString(10), comparer)).toEqual(null);
        });
    });

    describe("Utils.arrayRemoveIndex", function() {
        var array = [0, 1, 2, 3, 1, 5];

        it("Can remove the first value", function() {
            utils.arrayRemoveIndex(array, 0);

            expect(array.length).toBe(5);
            expect(array[0]).toBe(1);
        });

        it("Can remove the last value", function() {
            utils.arrayRemoveIndex(array, 4);

            expect(array.length).toBe(4);
            expect(array[3]).toBe(1);
        });

        it("Can remove a value at the middle", function() {
            utils.arrayRemoveIndex(array, 2);

            expect(array.length).toBe(3);
            expect(array[2]).toBe(1);
        });

        it("When the index is out of range, do nothing", function() {
            utils.arrayRemoveIndex(array, 999);

            expect(array.length).toBe(3);
        });
    });

    describe("Utils.arrayRemoveValue", function() {
        describe("Without comparer", function() {
            var array = [0, 1, 2, 3, 1, 5];

            it("Can remove the first value", function() {
                utils.arrayRemoveValue(array, 0);

                expect(array.length).toBe(5);
                expect(array[0]).toBe(1);
            });

            it("Can remove the last value", function() {
                utils.arrayRemoveValue(array, 5);

                expect(array.length).toBe(4);
                expect(array[3]).toBe(1);
            });

            it("Can remove a value at the middle", function() {
                utils.arrayRemoveValue(array, 3);

                expect(array.length).toBe(3);
                expect(array[2]).toBe(1);
            });

            it("When there is multiple occurence of the value, the first occurence is removed", function() {
                utils.arrayRemoveValue(array, 1);

                expect(array.length).toBe(2);
                expect(array[0]).toBe(2);
            });

            it("When the value is not in the array, do nothing", function() {
                utils.arrayRemoveValue(array, 999);

                expect(array.length).toBe(2);
            });
        });

        describe("With comparer", function() {
            var array = [{ key: "Key of 1", value: 1 }, { key: "Key of 2", value: 2 }, { key: "Key of 3", value: 3 }];

            var comparer = function(current, target) {
                return current.key === target;
            };

            it("When the value is in the array, remove the value", function() {
                utils.arrayRemoveValue(array, "Key of 2", comparer);

                expect(array.length).toBe(2);
            });

            it("When the value is not in the array, do nothing", function() {
                utils.arrayRemoveValue(array, dataSampler.generateString(10), comparer);

                expect(array.length).toBe(2);
            });
        });
    });

    describe("Utils.arrayClear", function() {
        it("Always remove all the items from the array", function() {
            var array = [dataSampler.generateString(10), dataSampler.generateString(10), dataSampler.generateString(10)];

            utils.arrayClear(array);

            expect(array.length).toBe(0);
        });
    });

    describe("Utils.arrayMap", function() {
        var array = null;

        beforeEach(function() {
            array = [dataSampler.generateString(10), dataSampler.generateString(10)];
        });

        it("Always iterate on all the items", function() {
            var mapper = function() {
                return "Mapped";
            };

            var mapped = utils.arrayMap(array, mapper);

            expect(mapped[0]).toBe("Mapped");
            expect(mapped[1]).toBe("Mapped");
        });

        it("Value and index passed to the mapper always match", function() {
            var mapper = function(value, index, originalArray) {
                expect(originalArray[index]).toBe(value);
            };

            utils.arrayMap(array, mapper);
        });

        it("When specified, set the context as \"this\"", function() {
            var context = {
                prop: dataSampler.generateString(10)
            };

            var mapper = function(value, index) {
                expect(areEquals(context, this)).toBeTruthy();
            };

            utils.arrayMap(array, mapper, context);
        });
    });

    describe("Utils.arrayMapToObject", function() {
        var array = [
            { prop1: "Key1", prop2: "Value1" },
            { prop1: "Key1", prop2: "Value1" },
            { prop1: "Key1", prop2: "Value1" }
        ];

        it("Always map all the items to an object using the specified key and value properties", function() {
            var mappedObject = utils.arrayMapToObject(array, "prop1", "prop2");

            for (var i = 0; i < array.length; i += 1) {
                expect(mappedObject[array[i].prop1]).toBe(array[i].prop2);
            }
        });
    });

    describe("Utils.objectMap", function() {
        var obj = null;

        beforeEach(function() {
            obj = {
                prop1: dataSampler.generateString(10), 
                prop2: dataSampler.generateString(10)
            };
        });

        it("Always iterate on all the properties", function() {
            var mapper = function() {
                return "Mapped";
            };

            var mapped = utils.objectMap(obj, mapper);

            expect(mapped.prop1).toBe("Mapped");
            expect(mapped.prop2).toBe("Mapped");
        });

        it("Value and property key passed to the mapper always match", function() {
            var mapper = function(value, propertyKey, originalObject) {
                expect(originalObject[propertyKey]).toBe(value);
            };

            utils.objectMap(obj, mapper);
        });

        it("When specified, set the context as \"this\"", function() {
            var context = {
                prop: dataSampler.generateString(10)
            };

            var mapper = function(value, propertyKey) {
                expect(areEquals(context, this)).toBeTruthy();
            };

            utils.objectMap(obj, mapper, context);
        });
    })

    describe("Utils.objectKeys", function() {
        var obj = {
            prop1: dataSampler.generateString(10), 
            prop2: dataSampler.generateString(10)
        };

        it("Always returns all the keys of the direct properties of the object", function() {
            var keys = utils.objectKeys(obj);

            expect(keys[0]).toBe("prop1");
            expect(keys[1]).toBe("prop2");
        });

        it("Never returns the keys of the non direct properties of the object", function() {
            expect(utils.objectKeys(obj).length).toBe(2);
        });
    });

    describe("Utils.objectSize", function() {
        it("Always match the number of direct properties of the object.", function() {
            var obj = {
                prop1: dataSampler.generateString(10), 
                prop2: dataSampler.generateString(10)
            };

            expect(utils.objectSize(obj)).toBe(2);
        });
    });

    describe("Utils.isImplementing", function() {
        var obj = {
            prop1: dataSampler.generateString(10), 
            prop2: dataSampler.generateString(10)
        };

        it("When the array is empty, returns false", function() {
            expect(utils.isImplementing(obj, [])).toBeFalsy();
        });

        it("When at least 1 property is not implemented by the object, returns false", function() {
            expect(utils.isImplementing(obj, ["prop3"])).toBeFalsy();
            expect(utils.isImplementing(obj, ["prop1", "prop2", "prop3"])).toBeFalsy();
        });

        it("When all the properties are implemented by the object, returns true", function() {
            expect(utils.isImplementing(obj, ["prop1", "prop2"])).toBeTruthy();
            expect(utils.isImplementing(obj, ["prop2"])).toBeTruthy();
        });
    });

    describe("Utils.isPartiallyImplementing", function() {
        var obj = {
            prop1: dataSampler.generateString(10), 
            prop2: dataSampler.generateString(10)
        };

        it("When the array is empty, returns false", function() {
            expect(utils.isPartiallyImplementing(obj, [])).toBeFalsy();
        });

        it("When all the properties are not implementend", function() {
            expect(utils.isPartiallyImplementing(obj, ["prop3"])).toBeFalsy();
        });

        it("When at least 1 property is not implemented by the object, returns true", function() {
            expect(utils.isPartiallyImplementing(obj, ["prop1", "prop2", "prop3"])).toBeTruthy();
        });

        it("When all the properties are implemented by the object, returns true", function() {
            expect(utils.isPartiallyImplementing(obj, ["prop1", "prop2"])).toBeTruthy();
            expect(utils.isPartiallyImplementing(obj, ["prop2"])).toBeTruthy();
        });
    });

    describe("Utils.stringFormat", function() {
        it("Always format the string with all the specified tokens", function() {
            var firstToken = dataSampler.generateString(10),
                secondToken = dataSampler.generateString(10),
                thirdToken = dataSampler.generateString(10);

            var formatted = utils.stringFormat("{1} - {2} - {3}", firstToken, secondToken, thirdToken);

            expect(formatted).toBe(firstToken + " - " + secondToken + " - " + thirdToken);
        });
    });

    describe("Utils.stringContains", function() {
        it("When the string contains the value, returns true", function() {
            expect(utils.stringContains("Hello world", "Hello world")).toBeTruthy();
            expect(utils.stringContains("Hello world", "wo")).toBeTruthy();
            expect(utils.stringContains("Hello world", "world")).toBeTruthy();
        });

        it("When the string do not contains the value, returns false", function() {
            expect(utils.stringContains("Hello world", dataSampler.generateString(10))).toBeFalsy();
        });
    });

    describe("Utils.stringStartsWith", function() {
        it("When the string starts with the value, return true", function() {
            expect(utils.stringStartsWith("Hello world", "Hel")).toBeTruthy();
        });

        it("When the string do not starts with the value, return false", function() {
            expect(utils.stringStartsWith("Hello world", "world")).toBeFalsy();
        });
    });

    describe("Utils.stringEndsWith", function() {
        it("When the string ends with the value, returns true", function() {
            expect(utils.stringEndsWith("Hello world", "d")).toBeTruthy();
        });

        it("When the string do not ends with the value, returns false", function() {
            expect(utils.stringEndsWith("Hello world", "H")).toBeFalsy();
        });
    });

    describe("Utils.stringEnsureEndsWith", function() {
        it("When the string do not ends with the specified character, append it to the string", function() {
            expect(utils.stringEnsureEndsWith("Hello world", "!")).toBe("Hello world!");
        });

        it("When the string do ends with the specified character, do nothing", function() {
            expect(utils.stringEnsureEndsWith("Hello world", "d")).toBe("Hello world");
        });
    });

    describe("Utils.generateGuid", function() {
        it("Each call always generated a new GUID", function() {
            var guid1 = utils.generateGuid(),
                guid2 = utils.generateGuid(),
                guid3 = utils.generateGuid();

            expect(guid1).not.toBe(guid2);
            expect(guid1).not.toBe(guid3);
            expect(guid2).not.toBe(guid3);
        });
    });
})(jQuery, Shelby.utils);