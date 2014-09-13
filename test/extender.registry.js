(function() {
    "use strict";

    describe("ExtenderRegistry", function() {
        var extenderRegistry = null;

        beforeEach(function() {
            extenderRegistry = new Shelby.ExtenderRegistry();
        });

        describe("add", function() {
            it("When the \"name\" is null or empty, throw an exception", function() {
                expect(function() { extenderRegistry.add(null, $.noop, dataSampler.generateString(10)); }).toThrow();
                expect(function() { extenderRegistry.add("", $.noop, dataSampler.generateString(10)); }).toThrow();
            });

            it("When the \"extender\" is not a function, throw an exception", function() {
                expect(function() { extenderRegistry.add(dataSampler.generateString(10), null, dataSampler.generateString(10)); }).toThrow();
                expect(function() { extenderRegistry.add(dataSampler.generateString(10), [], dataSampler.generateString(10)); }).toThrow();
            });

            it("Always add a new extender", function() {
                var path = dataSampler.generateString(10);
                var name = dataSampler.generateString(10);

                expect(extenderRegistry._extenders[path]).toBeUndefined();

                extenderRegistry.add(name, $.noop, path);

                expect(extenderRegistry._extenders[path]).not.toBeUndefined();
                expect(extenderRegistry._extenders[path][name]).not.toBeUndefined();
            });

            it("Can replace an existing extender", function() {
                var works = false;
                var path = dataSampler.generateString(10);
                var name = dataSampler.generateString(10);

                extenderRegistry.add(name, $.noop, path);

                extenderRegistry.add(name, function() {
                    works = true;
                }, path);

                extenderRegistry._extenders[path][name]();

                expect(works).toBeTruthy();
            });

            it("When the \"path\" is not specified, default to wildcard", function() {
                var name = dataSampler.generateString(10);

                extenderRegistry.add(name, $.noop);

                expect(extenderRegistry._extenders["*"]).not.toBeUndefined();
                expect(extenderRegistry._extenders["*"][name]).not.toBeUndefined();
            });
        });

        describe("remove", function() {
            it("When the \"name\" is null or empty, throw an exception", function() {
                expect(function() { extenderRegistry.add(null, dataSampler.generateString(10)); }).toThrow();
                expect(function() { extenderRegistry.add("", dataSampler.generateString(10)); }).toThrow();
            });

            it("Always remove the specified extender", function() {
                var path = dataSampler.generateString(10);
                var name = dataSampler.generateString(10);

                extenderRegistry.add(name, $.noop, path);

                expect(extenderRegistry._extenders[path][name]).not.toBeUndefined();

                extenderRegistry.remove(name, path);

                expect(extenderRegistry._extenders[path]).toBeUndefined();
            });

            it("When the \"path\" contains multiple extenders, only the specified extenders is removed", function() {
                var path = dataSampler.generateString(10);
                var name1 = dataSampler.generateString(10);
                var name2 = dataSampler.generateString(10);

                extenderRegistry.add(name1, $.noop, path);
                extenderRegistry.add(name2, $.noop, path);

                extenderRegistry.remove(name1, path);

                expect(extenderRegistry._extenders[path]).not.toBeUndefined();
                expect(extenderRegistry._extenders[path][name1]).toBeUndefined();
                expect(extenderRegistry._extenders[path][name2]).not.toBeUndefined();
            });

            it("When the \"path\" is not specified, default to wildcard", function() {
                var name = dataSampler.generateString(10);

                extenderRegistry.add(name, $.noop);
                extenderRegistry.remove(name);

                expect(extenderRegistry._extenders["*"]).toBeUndefined();
            });

            it("When an extender does not exists, nothing happens", function() {
                extenderRegistry.remove(dataSampler.generateString(10));
            });
        });

        describe("getExtenders", function() {
            it("Always returns all the extenders", function() {
                extenderRegistry.add(dataSampler.generateString(10), $.noop, "*");
                extenderRegistry.add(dataSampler.generateString(10), $.noop, "*");
                extenderRegistry.add(dataSampler.generateString(10), $.noop, "foo");

                var extenders = extenderRegistry.getExtenders();

                expect(extenders["*"]).not.toBeUndefined();
                expect(keys(extenders["*"]).length).toBe(2);
                expect(extenders["foo"]).not.toBeUndefined();
                expect(keys(extenders["foo"]).length).toBe(1);
            });
        });
    });
})();