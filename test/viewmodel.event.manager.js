(function() {
    "use strict";

    describe("EventManager", function() {
        var eventName = null;
        var eventManager = null;

        beforeEach(function() {
            eventName = dataSampler.generateString(10);
            eventManager = new Shelby.EventManager();
        });

        describe("registerEventHandler", function() {
            it("When the \"eventName\" is null or empty, throw an exception", function() {
                expect(function() { eventManager.registerEventHandler(null, $.noop); }).toThrow();
                expect(function() { eventManager.registerEventHandler("", $.noop); }).toThrow();
            });

            it("When the \"callback\" is not a function, throw an exception", function() {
                expect(function() { eventManager.registerEventHandler(eventName, null); }).toThrow();
                expect(function() { eventManager.registerEventHandler(eventName, []); }).toThrow();
            });

            it("Can register an handler for a new event", function() {
                eventManager.registerEventHandler(eventName, $.noop);

                expect(isNull(eventManager._eventHandlers[eventName])).toBeFalsy();
                expect(eventManager._eventHandlers[eventName].length).toBe(1);
            });

            it("Can register an handler for an existing event", function() {
                eventManager.registerEventHandler(eventName, $.noop);
                eventManager.registerEventHandler(eventName, $.noop);
                eventManager.registerEventHandler(eventName, $.noop);

                expect(eventManager._eventHandlers[eventName].length).toBe(3);
            });

            it("Can register a named handler", function() {
                eventManager.registerEventHandler("context." + eventName, $.noop);

                expect(eventManager._eventHandlers[eventName].length).toBe(1);
                expect(eventManager._eventHandlers[eventName][0].name).toBe("context");
            });

            it("Can register a named handler that contains multiple dot", function() {
                eventManager.registerEventHandler("context.foo.bar." + eventName, $.noop);

                expect(eventManager._eventHandlers[eventName].length).toBe(1);
                expect(eventManager._eventHandlers[eventName][0].name).toBe("context.foo.bar");
            });
        });

        describe("removeEventHandler", function() {
            it("When the \"eventName\" is null or empty, throw an exception", function() {
                expect(function() { eventManager.removeEventHandler(null); }).toThrow();
                expect(function() { eventManager.removeEventHandler(""); }).toThrow();
            });

            it("When this is an anonymous handler, throw an exception", function() {
                expect(function() { eventManager.removeEventHandler(eventName); }).toThrow();
            });

            it("Can remove a named handler", function() {
                eventManager.registerEventHandler("context." + eventName, $.noop);

                expect(eventManager._eventHandlers[eventName].length).toBe(1);

                eventManager.removeEventHandler("context." + eventName);

                expect(eventManager._eventHandlers[eventName].length).toBe(0);
            });

            it("Can remove a named handler that contains multiple dot", function() {
                eventManager.registerEventHandler("context.foo.bar." + eventName, $.noop);

                expect(eventManager._eventHandlers[eventName].length).toBe(1);

                eventManager.removeEventHandler("context.foo.bar." + eventName);

                expect(eventManager._eventHandlers[eventName].length).toBe(0);
            });

            it("When the named handler do not exists, do nothing", function() {
                eventManager.removeEventHandler("context." + eventName);
            });
        });

        describe("notifyHandlers", function() {
            it("Can notify anonymous handlers", function() {
                var works = false;

                eventManager.registerEventHandler(eventName, function() {
                    works = true;
                });

                eventManager.notifyHandlers(eventName);

                expect(works).toBeTruthy();
            });

            it("Can notify named handlers", function() {
                var works = false;

                eventManager.registerEventHandler("context."  +  eventName, function() {
                    works = true;
                });

                eventManager.notifyHandlers(eventName);

                expect(works).toBeTruthy();
            });

            it("Can notify multiple handlers", function() {
                var count = 0;

                eventManager.registerEventHandler(eventName, function() {
                    count += 1;
                });

                eventManager.registerEventHandler(eventName, function() {
                    count += 1;
                });

                eventManager.registerEventHandler(eventName, function() {
                    count += 1;
                });

                eventManager.notifyHandlers(eventName);

                expect(count).toBe(3);
            });

            it("Can notify anonymous and named handlers", function() {
                var count = 0;

                eventManager.registerEventHandler(eventName, function() {
                    count += 1;
                });

                eventManager.registerEventHandler("context." + eventName, function() {
                    count += 1;
                });

                eventManager.registerEventHandler("context.foo.bar." + eventName, function() {
                    count += 1;
                });

                eventManager.notifyHandlers(eventName);

                expect(count).toBe(3);
            });
        });
    });
})();