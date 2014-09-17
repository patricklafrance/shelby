(function(undefined) { 
    "use strict";

    describe("Shelby.Components", function() {
        describe("Singleton components", function() {
            it("Factory is called once", function() {
                var callCount = 0;
                var componentName = dataSampler.generateString(10);

                var factory = function() {
                    callCount += 1;

                    return null;
                };

                Shelby.Components.registerComponent(componentName, factory);

                Shelby.Components[componentName]();
                Shelby.Components[componentName]();
                Shelby.Components[componentName]();

                expect(callCount).toBe(1);
            });

            it("Can pass arguments to singleton component factory", function() {
                var works = false;
                var argumentToPass = dataSampler.generateString(10);
                var componentName = dataSampler.generateString(10);

                var factory = function(argument) {
                    works = (argumentToPass === argument);
                };

                Shelby.Components.registerComponent(componentName, factory);

                Shelby.Components[componentName](argumentToPass);

                expect(works).toBeTruthy();
            });
        });

        describe("Transient components", function() {
            it("Factory is called for every call", function() {
                var callCount = 0;
                var componentName = dataSampler.generateString(10);

                var factory = function() {
                    callCount += 1;
                };

                Shelby.Components.registerTransientComponent(componentName, factory);

                Shelby.Components[componentName]();
                Shelby.Components[componentName]();
                Shelby.Components[componentName]();

                expect(callCount).toBe(3);
            });

            it("Can pass arguments to transient component factory", function() {
                var works = false;
                var argumentToPass = dataSampler.generateString(10);
                var componentName = dataSampler.generateString(10);

                var factory = function(argument) {
                    works = (argumentToPass === argument);
                };

                Shelby.Components.registerTransientComponent(componentName, factory);

                Shelby.Components[componentName](argumentToPass);

                expect(works).toBeTruthy();
            });
        });

        it("Can get a \"filters\" instance", function() {
            expect(Shelby.Components.filters()).not.toBeNull();
        });

        it("Can get a \"propertyExtender\" instance", function() {
            expect(Shelby.Components.propertyExtender()).not.toBeNull();
        });

        it("Can get a \"parser\" instance", function() {
            expect(Shelby.Components.parser()).not.toBeNull();
        });

        it("Can get a \"ajax\" instance", function() {
            expect(Shelby.Components.ajax()).not.toBeNull();
        });

        it("Can get a \"mapper\" instance", function() {
            expect(Shelby.Components.mapper()).not.toBeNull();
        });

        describe("Can replace a native component", function() {
            var nativeComponentFactory = null;

            beforeEach(function() {
                nativeComponentFactory = Shelby.Components._factory._components["ajax"];
                delete Shelby.Components._factory._instances["ajax"];
            });

            afterEach(function() {
                Shelby.Components.registerComponent("ajax", nativeComponentFactory);
            });

            it("With a custom component", function() {
                var works = false;

                Shelby.Components.registerComponent("ajax", function() {
                    return {
                        send: function() {
                            works = true;
                        }
                    };
                });

                Shelby.Components.ajax().send();

                expect(works).toBeTruthy();
            });
        });

        describe("Can replace the native factory", function() {
            var nativeFactory = null;

            beforeEach(function() {
                nativeFactory = Shelby.Components._factory;
            });

            afterEach(function() {
                Shelby.Components.setComponentFactory(nativeFactory);
            });

            it("With a custom factory", function() {
                var works = false;

                Shelby.Components.setComponentFactory({
                    getComponent: function() {
                        works = true;
                    }
                });

                Shelby.Components.ajax();

                expect(works).toBeTruthy();
            });
        });
    });
})();