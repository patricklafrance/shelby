(function(undefined) { 
    "use strict";

    describe("Shelby.components", function() {
        it("Can get a \"filters\" instance", function() {
            expect(Shelby.components.filters()).not.toBeNull();
        });

        it("Can get a \"propertyExtender\" instance", function() {
            expect(Shelby.components.propertyExtender()).not.toBeNull();
        });

        it("Can get a \"parser\" instance", function() {
            expect(Shelby.components.parser()).not.toBeNull();
        });

        it("Can get a \"ajax\" instance", function() {
            expect(Shelby.components.ajax()).not.toBeNull();
        });

        it("Can get a \"mapper\" instance", function() {
            expect(Shelby.components.mapper()).not.toBeNull();
        });

        describe("Can replace a native component", function() {
            var nativeComponentFactory = null;

            beforeEach(function() {
                nativeComponentFactory = Shelby.components._factory._components["ajax"];
                delete Shelby.components._factory._instances["ajax"];
            });

            afterEach(function() {
                Shelby.components.registerComponent("ajax", nativeComponentFactory);
            });

            it("With a custom component", function() {
                var works = false;

                Shelby.components.registerComponent("ajax", function() {
                    return {
                        send: function() {
                            works = true;
                        }
                    };
                });

                Shelby.components.ajax().send();

                expect(works).toBeTruthy();
            });
        });

        describe("Can replace the native factory", function() {
            var nativeFactory = null;

            beforeEach(function() {
                nativeFactory = Shelby.components._factory;
            });

            afterEach(function() {
                Shelby.components.setComponentFactory(nativeFactory);
            });

            it("With a custom factory", function() {
                var works = false;

                Shelby.components.setComponentFactory({
                    getComponent: function() {
                        works = true;
                    }
                });

                Shelby.components.ajax();

                expect(works).toBeTruthy();
            });
        });
    });
})();