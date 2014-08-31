(function($) {
	"use strict";

	describe("ko.extenders.shelbyEdit", function() {
		var obs = null;

		beforeEach(function() {
			obs = ko.observable(dataSampler.generateString(5));

			obs[Shelby.namespace] = {};

			obs.extend({
				shelbySubscribe: true,
				shelbyEdit: true
			});
		});

		describe("beginEdit", function() {
			it("Always save the current observable value", function() {
				obs.shelby.beginEdit();

				expect(obs.shelby.current).toBe(obs.peek());
			});

			it("Always set the \"isEditing\" flag to true", function() {
				obs.shelby.beginEdit();

				expect(obs.shelby.isEditing).toBeTruthy();
			});

			it("When the observable is already in edition, nothing happens", function() {
				obs.shelby.beginEdit();
				obs.shelby.beginEdit();
			});

			describe("When notifications are deferred", function() {
				it("If it's not already paused, pause the observable subscriptions", function() {
					obs.shelby.beginEdit();

					expect(obs.shelby.isPause()).toBeTruthy();
				});

				it("If the observable subscriptions are pause, do nothing", function() {
					obs.shelby.pause();

					spyOn(obs.shelby, "pause");

					obs.shelby.beginEdit();

					expect(obs.shelby.pause).not.toHaveBeenCalled();
				});

				it("\"deferNotifications\" is true", function() {
					obs.shelby.beginEdit();

					expect(obs.shelby.deferNotifications).toBeTruthy();
				});
			});

			describe("When notifications are not deferred", function() {
				it("Never pause the observable subscriptions", function() {
					obs.shelby.beginEdit(false);

					expect(obs.shelby.isPause()).toBeFalsy();
				});

				it("\"deferNotifications\" is false", function() {
					obs.shelby.beginEdit(false);

					expect(obs.shelby.deferNotifications).toBeFalsy();
				});
			});
		});

		describe("endEdit", function() {
			describe("When is in edition", function() {
				it("When the value has changed during the edition, save the current observable value", function() {
					obs.shelby.beginEdit();
					obs("New value");
					obs.shelby.endEdit();

					expect(obs.peek()).toBe("New value");
				});

				describe("When notifications are deferred", function() {
					describe("When the observable was paused before beginning the edition", function() {
						it("Never trigger any subscriptions", function() {
							var works = true;

							obs.shelby.subscribe(function() {
								works = false;
							});

							obs.shelby.pause();
							obs.shelby.beginEdit();
							obs("New value");
							obs.shelby.endEdit();

							waits(20, 40, function() {
								expect(works).toBeTruthy();
							});
						});

						it("Never resume the observable subscriptions", function() {
							obs.shelby.subscribe($.noop);
							obs.shelby.pause();

							obs.shelby.beginEdit();
							obs.shelby.endEdit();

							waits(20, 40, function() {
								expect(obs.shelby.isPause()).toBeTruthy();
							});
						});
					});

					describe("When the observable was not paused before beginning the edition", function() {
						it("When the value has changed, trigger subscriptions", function() {
							var works = false;

							obs.shelby.subscribe(function() {
								works = true;
							});

							obs.shelby.beginEdit();
							obs("New value");
							obs.shelby.endEdit();

							waits(20, 40, function() {
								expect(works).toBeTruthy();
							});
						});

						it("When the value has not changed, do not trigger any subscriptions", function() {
							var works = true;

							obs.shelby.subscribe(function() {
								works = false;
							});

							obs.shelby.beginEdit();
							obs.shelby.endEdit();

							waits(20, 40, function() {
								expect(works).toBeTruthy();
							});
						});

						it("When the value has changed and \"canNotify\" is false, do not trigger any subscriptions", function() {
							var works = true;

							obs.shelby.subscribe(function() {
								works = false;
							});

							obs.shelby.beginEdit();
							obs("New value");
							obs.shelby.endEdit(false);

							var done = false;

							waits(20, 40, function() {
								expect(works).toBeTruthy();
							});
						});

						it("Always resume the observable subscriptions", function() {
							obs.shelby.beginEdit();
							obs.shelby.endEdit();

							waits(20, 40, function() {
								expect(obs.shelby.isPause()).toBeFalsy();
							});
						});
					});
				});

				describe("When notifications are not deferred", function() {
					it("Never resume the observable notifications", function() {
						obs.shelby.beginEdit(false);

						spyOn(obs.shelby, "resume");

						obs.shelby.endEdit();

						waits(20, 40, function() {
							expect(obs.shelby.resume).not.toHaveBeenCalled();
						});
					});
				});
			});

			it("Always set the \"isEditing\" flag to false", function() {
				obs.shelby.endEdit();

				expect(obs.shelby.isEditing).toBeFalsy();
			});

			it("Always set the \"hasMutated\" flag to false", function() {
				obs.shelby.endEdit();

				expect(obs.shelby.hasMutated).toBeFalsy();
			});
		});

		describe("cancelEdit", function() {
			describe("When is in edition", function() {
				it("When the value has changed, reset the observable value to the original value saved when beginning the edition", function() {
					var originalValue = obs.peek();

					obs.shelby.beginEdit();
					obs("New value");
					obs.shelby.cancelEdit();

					expect(obs.peek()).toBe(originalValue);
				});

				describe("When notifications are deferred", function() {
					it("When the observable was paused before beginning the edition, never resume the observable subscriptions", function() {
						obs.shelby.pause();
						obs.shelby.beginEdit();
						obs.shelby.cancelEdit();
						
						waits(20, 40, function() {
							expect(obs.shelby.isPause()).toBeTruthy();
						});				
					});

					it("When the observable was not paused before beginning the edition, resume the observable subscriptions", function() {
						obs.shelby.beginEdit();
						obs.shelby.cancelEdit();

						waits(20, 40, function() {
							expect(obs.shelby.isPause()).toBeFalsy();
						});
					});
				});

				describe("When notifications are not deferred", function() {
					it("Never resume the observable notifications", function() {
						obs.shelby.beginEdit(false);

						spyOn(obs.shelby, "resume");

						obs.shelby.cancelEdit();

						expect(obs.shelby.resume).not.toHaveBeenCalled();
					});
				});
			});

			it("Always set the \"isEditing\" flag to false", function() {
				obs.shelby.cancelEdit();

				expect(obs.shelby.isEditing).toBeFalsy();
			});

			it("Always set the \"hasMutated\" flag to false", function() {
				obs.shelby.cancelEdit();

				expect(obs.shelby.hasMutated).toBeFalsy();
			});
		});

		describe("resetEdit", function() {
			describe("When is in edition", function() {
				it("When the value has changed, reset the observable value to the original value saved when beginning the edition", function() {
					var originalValue = obs.peek();

					obs.shelby.beginEdit();
					obs("New value");
					obs.shelby.resetEdit();

					expect(obs.peek()).toBe(originalValue);
				});
			});

			it("Never modify the \"isEditing\" flag", function() {
				var before = obs.shelby.isEditing;

				obs.shelby.resetEdit();

				expect(obs.shelby.isEditing).toBe(before);
			});

			it("Never modify the \"hasMutated\" flag", function() {
				var before = obs.shelby.hasMutated;

				obs.shelby.resetEdit();

				expect(obs.shelby.hasMutated).toBe(before);
			});
		});
	});

	describe("Shelby.Extenders.edit", function() {
		var model = null,
			modelPropertyCount = null;

		beforeEach(function() {
			model = {
				prop1: ko.observable(dataSampler.generateString(10)),
				prop2: ko.observable(dataSampler.generateString(10)),
				nestedProp: {
					prop3: ko.observable(dataSampler.generateString(10)),
					prop4: ko.observable(dataSampler.generateString(10))
				},
				array: ko.observableArray([{
					prop5: ko.observable(dataSampler.generateString(10)),
					prop6: ko.observable(dataSampler.generateString(10))
				}])
			};

			Shelby.Factory.instance.propertyExtender().add(model, {
				"*": {
					"subscribe": Shelby.Extenders.subscribe,
					"edit": Shelby.Extenders.edit
				}
			});

			modelPropertyCount = 7;
		});

		describe("Shelby.Extenders.edit.beginEdit", function() {
			it("When \"include\" and \"exclude\" options are not specified, begin edition of all the properties", function() {
				model.shelby.beginEdit();

				expect(model.prop1.shelby.isEditing).toBeTruthy();
				expect(model.prop2.shelby.isEditing).toBeTruthy();
				expect(model.nestedProp.prop3.shelby.isEditing).toBeTruthy();
				expect(model.nestedProp.prop4.shelby.isEditing).toBeTruthy();
				expect(model.array.shelby.isEditing).toBeTruthy();
				expect(model.array.peek()[0].prop5.shelby.isEditing).toBeTruthy();
				expect(model.array.peek()[0].prop6.shelby.isEditing).toBeTruthy();
			});

			it("Can begin edition of deep properties", function() {
				model.shelby.beginEdit();

				expect(model.nestedProp.prop3.shelby.isEditing).toBeTruthy();
				expect(model.nestedProp.prop4.shelby.isEditing).toBeTruthy();
			});

			it("Can begin edition of deep properties contained in array", function() {
				model.shelby.beginEdit();

				expect(model.array.peek()[0].prop5.shelby.isEditing).toBeTruthy();
				expect(model.array.peek()[0].prop6.shelby.isEditing).toBeTruthy();
			});

			it("When the \"include\" options is specified, only begin edition of properties to include", function() {
				model.shelby.beginEdit({
					include: ["{root}.prop1", "{root}.nestedProp.prop3", "{root}.array[i].prop5"]
				});

				expect(model.prop1.shelby.isEditing).toBeTruthy();
				expect(model.prop2.shelby.isEditing).toBeFalsy();
				expect(model.nestedProp.prop3.shelby.isEditing).toBeTruthy();
				expect(model.nestedProp.prop4.shelby.isEditing).toBeFalsy();
				expect(model.array.shelby.isEditing).toBeFalsy();
				expect(model.array.peek()[0].prop5.shelby.isEditing).toBeTruthy();
				expect(model.array.peek()[0].prop6.shelby.isEditing).toBeFalsy();
			});

			it("When the \"include\" options is specified for an array, begin the edition of the array itself but do not begin the edition of the array items", function() {
				model.shelby.beginEdit({
					include: ["{root}.array"]
				});

				expect(model.array.shelby.isEditing).toBeTruthy();
				expect(model.array.peek()[0].prop5.shelby.isEditing).toBeFalsy();
				expect(model.array.peek()[0].prop6.shelby.isEditing).toBeFalsy();
			});

			it("When the \"include\" options is specified for the items of an array, begin the edition of the items of the array but do not begin the edition of the array itself", function() {
				model.shelby.beginEdit({
					include: ["{root}.array[i]"]
				});

				expect(model.array.shelby.isEditing).toBeFalsy();
				expect(model.array.peek()[0].prop5.shelby.isEditing).toBeTruthy();
				expect(model.array.peek()[0].prop6.shelby.isEditing).toBeTruthy();
			});

			it("When the \"exclude\" options is specified, begin the edition of the properties that are not excluded", function() {
				model.shelby.beginEdit({
					exclude: ["{root}.prop1", "{root}.nestedProp.prop3", "{root}.array[i].prop5"]
				});

				expect(model.prop1.shelby.isEditing).toBeFalsy();
				expect(model.prop2.shelby.isEditing).toBeTruthy();
				expect(model.nestedProp.prop3.shelby.isEditing).toBeFalsy();
				expect(model.nestedProp.prop4.shelby.isEditing).toBeTruthy();
				expect(model.array.shelby.isEditing).toBeTruthy();
				expect(model.array.peek()[0].prop5.shelby.isEditing).toBeFalsy();
				expect(model.array.peek()[0].prop6.shelby.isEditing).toBeTruthy();
			});

			it("When the \"exclude\" options is specified for an array, do not begin the edition of the array itself but begin the edition of the items of the array", function() {
				model.shelby.beginEdit({
					exclude: ["{root}.array"]
				});

				expect(model.array.shelby.isEditing).toBeFalsy();
				expect(model.array.peek()[0].prop5.shelby.isEditing).toBeTruthy();
				expect(model.array.peek()[0].prop6.shelby.isEditing).toBeTruthy();
			});

			it("When the \"exclude\" options is specified for the items of an array, do not begin the edition of items of the array but begin the edition of the array itself", function() {
				model.shelby.beginEdit({
					exclude: ["{root}.array[i]"]
				});

				expect(model.array.shelby.isEditing).toBeTruthy();
				expect(model.array.peek()[0].prop5.shelby.isEditing).toBeFalsy();
				expect(model.array.peek()[0].prop6.shelby.isEditing).toBeFalsy();
			});

			it("When the \"include\" and \"exclude\" options are both specified, the \"include\" options is used", function() {
				model.shelby.beginEdit({
					include: ["{root}.prop1"]
				});

				expect(model.prop1.shelby.isEditing).toBeTruthy();
			});

			it("Always save the specified options", function() {
				var options = {
					include: ["{root}.prop1"]
				};

				model.shelby.beginEdit(options);

				expect(areEquals(options, model.shelby._editOptions)).toBeTruthy();
			});

			it("Always set the \"isEditing\" flag to true", function() {
				model.shelby.beginEdit();

				expect(model.shelby.isEditing).toBeTruthy();
			});

			describe("When the model is already in edition", function() {
				it("Do not begin the edition of the properties again", function() {
					model.shelby.beginEdit();

					spyOn(model.prop1.shelby, "beginEdit");
					spyOn(model.prop2.shelby, "beginEdit");
					spyOn(model.nestedProp.prop3.shelby, "beginEdit");
					spyOn(model.nestedProp.prop4.shelby, "beginEdit");
					spyOn(model.array.shelby, "beginEdit");
					spyOn(model.array.peek()[0].prop5.shelby, "beginEdit");
					spyOn(model.array.peek()[0].prop6.shelby, "beginEdit");

					model.shelby.beginEdit();

					expect(model.prop1.shelby.beginEdit).not.toHaveBeenCalled();
					expect(model.prop2.shelby.beginEdit).not.toHaveBeenCalled();
					expect(model.nestedProp.prop3.shelby.beginEdit).not.toHaveBeenCalled();
					expect(model.nestedProp.prop4.shelby.beginEdit).not.toHaveBeenCalled();
					expect(model.array.shelby.beginEdit).not.toHaveBeenCalled();
					expect(model.array.peek()[0].prop5.shelby.beginEdit).not.toHaveBeenCalled();
					expect(model.array.peek()[0].prop6.shelby.beginEdit).not.toHaveBeenCalled();
				});

				it("Do not overwrite the options", function() {
					var options = {
						include: ["{root}.prop1"]
					};

					model.shelby.beginEdit(options);

					model.shelby.beginEdit({
						include: ["{root}.prop2"]
					});

					expect(areEquals(options, model.shelby._editOptions)).toBeTruthy();
				});
			});
		});

		describe("Shelby.Extenders.edit.endEdit", function() {
			describe("When is in edition", function() {
				describe("Always end the edition of all the properties in edition", function() {
					it("When no \"include\" or \"exclude\" options are specified", function() {
						model.shelby.beginEdit();
						model.shelby.endEdit();

						expect(model.prop1.shelby.isEditing).toBeFalsy();
						expect(model.prop2.shelby.isEditing).toBeFalsy();
						expect(model.nestedProp.prop3.shelby.isEditing).toBeFalsy();
						expect(model.nestedProp.prop4.shelby.isEditing).toBeFalsy();
						expect(model.array.shelby.isEditing).toBeFalsy();
						expect(model.array.peek()[0].prop5.shelby.isEditing).toBeFalsy();
						expect(model.array.peek()[0].prop6.shelby.isEditing).toBeFalsy();
					});

					it("When \"include\" options are specified", function() {
						spyOn(model.prop1.shelby, "endEdit");
						spyOn(model.prop2.shelby, "endEdit");
						spyOn(model.nestedProp.prop3.shelby, "endEdit");
						spyOn(model.nestedProp.prop4.shelby, "endEdit");
						spyOn(model.array.shelby, "endEdit");
						spyOn(model.array.peek()[0].prop5.shelby, "endEdit");
						spyOn(model.array.peek()[0].prop6.shelby, "endEdit");

						model.shelby.beginEdit({
							include: ["{root}.prop1", "{root}.nestedProp.prop3", "{root}.array[i].prop5"]
						});

						model.shelby.endEdit();

						expect(model.prop1.shelby.endEdit).toHaveBeenCalled();
						expect(model.prop2.shelby.endEdit).not.toHaveBeenCalled();
						expect(model.nestedProp.prop3.shelby.endEdit).toHaveBeenCalled();
						expect(model.nestedProp.prop4.shelby.endEdit).not.toHaveBeenCalled();
						expect(model.array.shelby.endEdit).not.toHaveBeenCalled();
						expect(model.array.peek()[0].prop5.shelby.endEdit).toHaveBeenCalled();
						expect(model.array.peek()[0].prop6.shelby.endEdit).not.toHaveBeenCalled();	
					});
				});

				it("When \"notifyOnce\" is not true, call the callback of all the edited properties", function() {
					var prop1Called = false,
						prop2Called = false,
						prop3Called = false,
						prop4Called = false,
						prop5Called = false,
						prop6Called = false;

					model.shelby.subscribe(function(args) {
						if (args.path === "{root}.prop1") {
							prop1Called = true;
						}
						else if (args.path === "{root}.prop2") {
							prop2Called = true;
						}
						else if (args.path === "{root}.nestedProp.prop3") {
							prop3Called = true;
						}
						else if (args.path === "{root}.nestedProp.prop4") {
							prop4Called = true;
						}
						else if (args.path === "{root}.array[i].prop5") {
							prop5Called = true;
						}
						else if (args.path === "{root}.array[i].prop6") {
							prop6Called = true;
						}
					});

					model.shelby.beginEdit();

					model.prop1(dataSampler.generateString(10));
					model.prop2(dataSampler.generateString(10));
					model.nestedProp.prop3(dataSampler.generateString(10));
					model.nestedProp.prop4(dataSampler.generateString(10));
					model.array.peek()[0].prop5(dataSampler.generateString(10));
					model.array.peek()[0].prop6(dataSampler.generateString(10));

					model.shelby.endEdit();

					waits(20, 40, function() {
						expect(prop1Called).toBeTruthy();
						expect(prop2Called).toBeTruthy();
						expect(prop3Called).toBeTruthy();
						expect(prop4Called).toBeTruthy();
						expect(prop5Called).toBeTruthy();
						expect(prop6Called).toBeTruthy();
					});
				});

				it("When \"notifyOnce\" is true, only call the callback of the first edited property", function() {
					var prop1Called = false,
						prop2Called = false,
						prop3Called = false,
						prop4Called = false,
						prop5Called = false,
						prop6Called = false;

					model.shelby.subscribe(function(args) {
						if (args.path === "{root}.prop1") {
							prop1Called = true;
						}
						else if (args.path === "{root}.prop2") {
							prop2Called = true;
						}
						else if (args.path === "{root}.nestedProp.prop3") {
							prop3Called = true;
						}
						else if (args.path === "{root}.nestedProp.prop4") {
							prop4Called = true;
						}
						else if (args.path === "{root}.array[i].prop5") {
							prop5Called = true;
						}
						else if (args.path === "{root}.array[i].prop6") {
							prop6Called = true;
						}
					});

					model.shelby.beginEdit();

					model.prop1(dataSampler.generateString(10));
					model.prop2(dataSampler.generateString(10));
					model.nestedProp.prop3(dataSampler.generateString(10));
					model.nestedProp.prop4(dataSampler.generateString(10));
					model.array.peek()[0].prop5(dataSampler.generateString(10));
					model.array.peek()[0].prop6(dataSampler.generateString(10));

					model.shelby.endEdit(true);

					waits(20, 40, function() {
						expect(prop1Called).toBeTruthy();
						expect(prop2Called).toBeFalsy();
						expect(prop3Called).toBeFalsy();
						expect(prop4Called).toBeFalsy();
						expect(prop5Called).toBeFalsy();
						expect(prop6Called).toBeFalsy();
					});
				});

				it("When \"notifyOnce\" is true and the edition has been started with the \"defer notifications\" disabled, throw an exception", function() {
					model.shelby.beginEdit({
						deferNotifications: true
					});

					expect(function() { model.shelby.endEdit(true); }).toThrow();
				});

				it("Always set the \"isEditing\" flag to false", function() {
					model.shelby.beginEdit();
					model.shelby.endEdit();

					expect(model.shelby.isEditing).toBeFalsy();
				});
			});

			describe("When is not in edition", function() {
				it("Never try to end the edition of any properties", function() {
					spyOn(model.prop1.shelby, "endEdit");
					spyOn(model.prop2.shelby, "endEdit");
					spyOn(model.nestedProp.prop3.shelby, "endEdit");
					spyOn(model.nestedProp.prop4.shelby, "endEdit");
					spyOn(model.array.shelby, "endEdit");
					spyOn(model.array.peek()[0].prop5.shelby, "endEdit");
					spyOn(model.array.peek()[0].prop6.shelby, "endEdit");

					model.shelby.endEdit();

					expect(model.prop1.shelby.endEdit).not.toHaveBeenCalled();
					expect(model.prop2.shelby.endEdit).not.toHaveBeenCalled();
					expect(model.nestedProp.prop3.shelby.endEdit).not.toHaveBeenCalled();
					expect(model.nestedProp.prop4.shelby.endEdit).not.toHaveBeenCalled();
					expect(model.array.shelby.endEdit).not.toHaveBeenCalled();
					expect(model.array.peek()[0].prop5.shelby.endEdit).not.toHaveBeenCalled();
					expect(model.array.peek()[0].prop6.shelby.endEdit).not.toHaveBeenCalled();
				});
			});
		});

		describe("Shelby.Extenders.edit.cancelEdit", function() {
			describe("Always cancel the edition of all the properties in edition", function() {
				it("When no \"include\" or \"exclude\" options are specified", function() {
					spyOn(model.prop1.shelby, "cancelEdit");
					spyOn(model.prop2.shelby, "cancelEdit");
					spyOn(model.nestedProp.prop3.shelby, "cancelEdit");
					spyOn(model.nestedProp.prop4.shelby, "cancelEdit");
					spyOn(model.array.shelby, "cancelEdit");
					spyOn(model.array.peek()[0].prop5.shelby, "cancelEdit");
					spyOn(model.array.peek()[0].prop6.shelby, "cancelEdit");

					model.shelby.beginEdit();
					model.shelby.cancelEdit();

					expect(model.prop1.shelby.cancelEdit).toHaveBeenCalled();
					expect(model.prop2.shelby.cancelEdit).toHaveBeenCalled();
					expect(model.nestedProp.prop3.shelby.cancelEdit).toHaveBeenCalled();
					expect(model.nestedProp.prop4.shelby.cancelEdit).toHaveBeenCalled();
					expect(model.array.shelby.cancelEdit).toHaveBeenCalled();
					expect(model.array.peek()[0].prop5.shelby.cancelEdit).toHaveBeenCalled();
					expect(model.array.peek()[0].prop6.shelby.cancelEdit).toHaveBeenCalled();
				});

				it("When \"include\" options are specified", function() {
					spyOn(model.prop1.shelby, "cancelEdit");
					spyOn(model.prop2.shelby, "cancelEdit");
					spyOn(model.nestedProp.prop3.shelby, "cancelEdit");
					spyOn(model.nestedProp.prop4.shelby, "cancelEdit");
					spyOn(model.array.shelby, "cancelEdit");
					spyOn(model.array.peek()[0].prop5.shelby, "cancelEdit");
					spyOn(model.array.peek()[0].prop6.shelby, "cancelEdit");

					model.shelby.beginEdit({
						include: ["{root}.prop1", "{root}.nestedProp.prop3", "{root}.array[i].prop5"]
					});

					model.shelby.cancelEdit();

					expect(model.prop1.shelby.cancelEdit).toHaveBeenCalled();
					expect(model.prop2.shelby.cancelEdit).not.toHaveBeenCalled();
					expect(model.nestedProp.prop3.shelby.cancelEdit).toHaveBeenCalled();
					expect(model.nestedProp.prop4.shelby.cancelEdit).not.toHaveBeenCalled();
					expect(model.array.shelby.cancelEdit).not.toHaveBeenCalled();
					expect(model.array.peek()[0].prop5.shelby.cancelEdit).toHaveBeenCalled();
					expect(model.array.peek()[0].prop6.shelby.cancelEdit).not.toHaveBeenCalled();	
				});
			});

			it("Always set the \"isEditing\" flag to false", function() {
				model.shelby.beginEdit();
				model.shelby.cancelEdit();

				expect(model.shelby.isEditing).toBeFalsy();
			});
		});

		describe("Shelby.Extenders.edit.resetEdit", function() {
			describe("Always reset the value of all the properties in edition", function() {
				it("When no \"include\" or \"exclude\" options are specified", function() {
					spyOn(model.prop1.shelby, "resetEdit");
					spyOn(model.prop2.shelby, "resetEdit");
					spyOn(model.nestedProp.prop3.shelby, "resetEdit");
					spyOn(model.nestedProp.prop4.shelby, "resetEdit");
					spyOn(model.array.shelby, "resetEdit");
					spyOn(model.array.peek()[0].prop5.shelby, "resetEdit");
					spyOn(model.array.peek()[0].prop6.shelby, "resetEdit");

					model.shelby.beginEdit();
					model.shelby.resetEdit();

					expect(model.prop1.shelby.resetEdit).toHaveBeenCalled();
					expect(model.prop2.shelby.resetEdit).toHaveBeenCalled();
					expect(model.nestedProp.prop3.shelby.resetEdit).toHaveBeenCalled();
					expect(model.nestedProp.prop4.shelby.resetEdit).toHaveBeenCalled();
					expect(model.array.shelby.resetEdit).toHaveBeenCalled();
					expect(model.array.peek()[0].prop5.shelby.resetEdit).toHaveBeenCalled();
					expect(model.array.peek()[0].prop6.shelby.resetEdit).toHaveBeenCalled();
				});

				it("When \"include\" options are specified", function() {
					spyOn(model.prop1.shelby, "resetEdit");
					spyOn(model.prop2.shelby, "resetEdit");
					spyOn(model.nestedProp.prop3.shelby, "resetEdit");
					spyOn(model.nestedProp.prop4.shelby, "resetEdit");
					spyOn(model.array.shelby, "resetEdit");
					spyOn(model.array.peek()[0].prop5.shelby, "resetEdit");
					spyOn(model.array.peek()[0].prop6.shelby, "resetEdit");

					model.shelby.beginEdit({
						include: ["{root}.prop1", "{root}.nestedProp.prop3", "{root}.array[i].prop5"]
					});

					model.shelby.resetEdit();

					expect(model.prop1.shelby.resetEdit).toHaveBeenCalled();
					expect(model.prop2.shelby.resetEdit).not.toHaveBeenCalled();
					expect(model.nestedProp.prop3.shelby.resetEdit).toHaveBeenCalled();
					expect(model.nestedProp.prop4.shelby.resetEdit).not.toHaveBeenCalled();
					expect(model.array.shelby.resetEdit).not.toHaveBeenCalled();
					expect(model.array.peek()[0].prop5.shelby.resetEdit).toHaveBeenCalled();
					expect(model.array.peek()[0].prop6.shelby.resetEdit).not.toHaveBeenCalled();	
				});
			});

			it("Never set the \"isEditing\" flag to false", function() {
				model.shelby.beginEdit();
				model.shelby.resetEdit();

				expect(model.shelby.isEditing).not.toBeFalsy();
			});
		});

		describe("Shelby.Extenders.edit.hasMutated", function() {
			describe("When is in edition", function() {
				it("When at least one value has changed, return true", function() {
					model.shelby.beginEdit();

					model.prop1(dataSampler.generateString(10));

					expect(model.shelby.hasMutated()).toBeTruthy();
				});

				it("When no values has changed, return false", function() {
					model.shelby.beginEdit();

					expect(model.shelby.hasMutated()).toBeFalsy();
				});
			});

			it("When is not in edition, returns false", function() {
				expect(model.shelby.hasMutated()).toBeFalsy();
			});
		});
	});
})(jQuery);