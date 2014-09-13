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
            var barFirstExtenderName = dataSampler.generateString(10);

            beforeEach(function() {
                extenderRegistry.add(dataSampler.generateString(10), $.noop, "*");
                extenderRegistry.add(dataSampler.generateString(10), $.noop, "*");
                extenderRegistry.add(dataSampler.generateString(10), $.noop, "*");

                extenderRegistry.add(dataSampler.generateString(10), $.noop, "foo");

                extenderRegistry.add(barFirstExtenderName, $.noop, "bar");
                extenderRegistry.add(dataSampler.generateString(10), $.noop, "bar");
            });

            it("Always returns all the extenders for the specified \"path\"", function() {
                expect(extenderRegistry.getExtenders("bar").length).toBe(2);
            });

            it("When the \"path\" is not specified, default to wildcard", function() {
                expect(extenderRegistry.getExtenders().length).toBe(3);
            });

            it("When the \"path\" doesn't exists, returns an empty array", function() {
                expect(extenderRegistry.getExtenders(dataSampler.generateString(10)).length).toBe(0);
            });

            it("When the \"path\" has been requested multiple times, retrieve the extenders from the cache", function() {
                extenderRegistry.getExtenders("bar");

                extenderRegistry._extenders = {};

                expect(extenderRegistry.getExtenders("bar").length).toBe(2);
            });

            it("When an extender is added, invalid the cache", function() {
                extenderRegistry.getExtenders("bar");

                expect(extenderRegistry._cache["bar"].length).toBe(2);

                extenderRegistry.add(dataSampler.generateString(10), $.noop, dataSampler.generateString(10));

                expect(extenderRegistry._cache["bar"]).toBeUndefined();
            });

            it("When an extender is removed, invalid the cache", function() {
                extenderRegistry.getExtenders("bar");

                expect(extenderRegistry._cache["bar"].length).toBe(2);

                extenderRegistry.remove(barFirstExtenderName, "bar");

                expect(extenderRegistry._cache["bar"]).toBeUndefined();
            });
        });
    });
})();