(function($) {
	"use strict";

	describe("ko.extenders.shelbySubscribe", function() {
		var obs = null;

		beforeEach(function() {
			obs = ko.observable(dataSampler.generateString(5));

			obs[Shelby.namespace] = {};

			obs.extend({
				shelbySubscribe: true
			});
		});

		describe("pausableSubscription", function() {
			it("When callback is not a function, throw an exception", function() {
				expect(function() { obs.shelby.subscribe(null); }).toThrow();
			});

			it("When a callback target is specified, subscription callback is called with the target as context", function() {
				var works = false;

				var callbackTarget = {
					prop1: dataSampler.generateString(10)
				};

				obs.shelby.subscribe(function() {
					works = areEquals(this, callbackTarget);
				}, callbackTarget);

				obs(dataSampler.generateString(10));

				expect(works).toBeTruthy();
			});

			it("When an event is specified, subscription is only called on value update matching the event", function() {
				var subscription1Called = false,
					subscription2Called = false;

				obs.shelby.subscribe(function() {
					subscription1Called = true;
				}, null, "test1");

				obs.shelby.subscribe(function() {
					subscription2Called = true;
				}, null, "test2");

				obs.notifySubscribers(dataSampler.generateString(10), "test1");

				expect(subscription1Called).toBeTruthy();
				expect(subscription2Called).toBeFalsy();
			});

			it("When an observable have multiples subscriptions, all subscriptions are called on value update", function() {
				var subscription1Called = false,
					subscription2Called = false;

				obs.shelby.subscribe(function() {
					subscription1Called = true;
				});

				obs.shelby.subscribe(function() {
					subscription2Called = true;
				});

				obs(dataSampler.generateString(10));

				expect(subscription1Called).toBeTruthy();
				expect(subscription2Called).toBeTruthy();
			});

			it("When an observable have paused subscriptions, the paused subscriptions are not called on value update", function() {
				var subscription1Called = false,
					subscription2Called = false;

				var subscription1 = obs.shelby.subscribe(function() {
					subscription1Called = true;
				});

				var subscription2 = obs.shelby.subscribe(function() {
					subscription2Called = true;
				});

				subscription1.pause();
				subscription2.pause();

				obs(dataSampler.generateString(10));

				expect(subscription1Called).toBeFalsy();
				expect(subscription2Called).toBeFalsy();
			});

			it("When a subscription is resumed, the subscription is called on value update", function() {
				var subscriptionCalled = false;

				var subscription = obs.shelby.subscribe(function() {
					subscriptionCalled = true;
				});

				subscription.pause();
				subscription.resume();

				obs(dataSampler.generateString(10));

				expect(subscriptionCalled).toBeTruthy();
			});

			it("When a subscription is disposed, the native knockout subscription is disposed", function() {
				var subscription = obs.shelby.subscribe($.noop);

				expect(obs._subscriptions.change.length).toBe(1);

				subscription.dispose();

				expect(obs._subscriptions.change.length).toBe(0);
			});
		});

		describe("pause", function() {
			it("Always pause subscription", function() {
				var subscriptionCalled = false;

				obs.shelby.subscribe(function() {
					subscriptionCalled = true;
				});

				obs.shelby.pause();
				obs(dataSampler.generateString(10));

				expect(subscriptionCalled).toBeFalsy();
			});
		});

		describe("resume", function() {
			it("Always resume subscription", function() {
				var subscriptionCalled = false;

				obs.shelby.subscribe(function() {
					subscriptionCalled = true;
				});

				obs.shelby.pause();
				obs.shelby.resume();

				obs(dataSampler.generateString(10));

				expect(subscriptionCalled).toBeTruthy();
			});
		});

		describe("isPause", function() {
			it("When subscription is pause, return true", function() {
				obs.shelby.pause();

				expect(obs.shelby.isPause()).toBeTruthy();
			});

			it("When subscription is not pause, return false", function() {
				obs.shelby.resume();

				expect(obs.shelby.isPause()).toBeFalsy();
			});
		});
	});

	describe("ko.extenders.shelbyArraySubscribe", function() {
		var obs = null;

		beforeEach(function() {
			obs = ko.observableArray([]);

			obs[Shelby.namespace] = {};

			obs.extend({
				shelbySubscribe: true,
				shelbyArraySubscribe: true
			});
		});

		describe("pausableArraySubscription", function() {
			describe("When the \"evaluateChanges\" options is undefined or true", function() {
				it("When callback is not a function, throw an exception", function() {
					expect(function() { obs.shelby.subscribe(null); }).toThrow();
				});

				it("When a callback target is specified, subscription callback is called with the target as context", function() {
					var works = false;

					var callbackTarget = {
						prop1: dataSampler.generateString(10)
					};

					obs.shelby.subscribe(function() {
						works = areEquals(this, callbackTarget);
					}, callbackTarget);

					obs.push(dataSampler.generateString(10));

					expect(works).toBeTruthy();
				});

				it("When an observable have multiples subscriptions, all subscriptions are called on value update", function() {
					var subscription1Called = false,
						subscription2Called = false;

					obs.shelby.subscribe(function() {
						subscription1Called = true;
					});

					obs.shelby.subscribe(function() {
						subscription2Called = true;
					});

					obs.push(dataSampler.generateString(10));

					expect(subscription1Called).toBeTruthy();
					expect(subscription2Called).toBeTruthy();
				});

				it("When an observable have paused subscriptions, the paused subscriptions are not called on value update", function() {
					var subscription1Called = false,
						subscription2Called = false;

					var subscription1 = obs.shelby.subscribe(function() {
						subscription1Called = true;
					});

					var subscription2 = obs.shelby.subscribe(function() {
						subscription2Called = true;
					});

					subscription1.pause();
					subscription2.pause();

					obs.push(dataSampler.generateString(10));

					expect(subscription1Called).toBeFalsy();
					expect(subscription2Called).toBeFalsy();
				});

				it("When a subscription is resumed, the subscription is called on value update", function() {
					var subscriptionCalled = false;

					var subscription = obs.shelby.subscribe(function() {
						subscriptionCalled = true;
					});

					subscription.pause();
					subscription.resume();

					obs.push(dataSampler.generateString(10));

					expect(subscriptionCalled).toBeTruthy();
				});

				it("When a subscription is disposed, the native knockout subscription is disposed", function() {
					var subscription = obs.shelby.subscribe($.noop);

					expect(obs._subscriptions.change.length).toBe(1);

					subscription.dispose();

					expect(obs._subscriptions.change.length).toBe(0);
				});

				it("Subscription event is always \"arrayChange\"", function() {
					spyOn(obs, "subscribe");

					obs.shelby.subscribe($.noop, null, dataSampler.generateString(10));

					expect(obs.subscribe).toHaveBeenCalledWith(jasmine.any(Function), null, "arrayChange");
				});

				it("Callback \"extendArguments\" argument is always true", function() {
					var works = false;

					obs.shelby.subscribe(function() {
						works = arguments[1] === true;
					});

					obs.push(dataSampler.generateString(10));

					expect(works).toBeTruthy();
				});

				it("Callback \"extender\" argument is always \"shelbyArraySubscribe\"", function() {
					var works = false;

					obs.shelby.subscribe(function() {
						works = arguments[2] === "shelbyArraySubscribe";
					});

					obs.push(dataSampler.generateString(10));

					expect(works).toBeTruthy();
				});
			});

			describe("When the \"evaluateChanges\" options is false", function() {
				it("Never modify the subscription event", function() {
					var event = dataSampler.generateString(10);

					spyOn(obs, "subscribe"),

					obs.shelby.subscribe($.noop, null, event, { evaluateChanges: false });

					expect(obs.subscribe).toHaveBeenCalledWith(jasmine.any(Function), null, event, { evaluateChanges: false });
				});

				it("Never specify a callback argument \"extendArguments\"", function() {
					var works = false;

					obs.shelby.subscribe(function() {
						works = isUndefined(arguments[1]);
					}, null, "", { evaluateChanges: false });

					obs.push(dataSampler.generateString(10));

					expect(works).toBeTruthy();
				});

				it("Never specify a callback argument \"extender\"", function() {
					var works = false;

					obs.shelby.subscribe(function() {
						works = isUndefined(arguments[2]);
					}, null, "", { evaluateChanges: false });

					obs.push(dataSampler.generateString(10));

					expect(works).toBeTruthy();
				});
			});
		});

		describe("pause", function() {
			it("Always pause subscription", function() {
				var subscriptionCalled = false;

				obs.shelby.subscribe(function() {
					subscriptionCalled = true;
				});


				obs.shelby.pause();
				obs(dataSampler.generateString(10));

				expect(subscriptionCalled).toBeFalsy();
			});
		});

		describe("resume", function() {
			it("Always resume subscription", function() {
				var subscriptionCalled = false;

				obs.shelby.subscribe(function() {
					subscriptionCalled = true;
				});

				obs.shelby.pause();
				obs.shelby.resume();

				obs(dataSampler.generateString(10));

				expect(subscriptionCalled).toBeTruthy();
			});
		});

		describe("isPause", function() {
			it("When subscription is pause, return true", function() {
				obs.shelby.pause();

				expect(obs.shelby.isPause()).toBeTruthy();
			});

			it("When subscription is not pause, return false", function() {
				obs.shelby.resume();

				expect(obs.shelby.isPause()).toBeFalsy();
			});
		});
	});

	describe("Shelby.Extenders.subscribe", function() {
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

			Shelby.components.propertyExtender().add(model, {
				"*": {
					"subscribe": Shelby.Extenders.subscribe
				}
			});

			modelPropertyCount = 7;
		});

		describe("subscribe", function() {
			it("When callback is null, throw an exception", function() {
				expect(function() { model.shelby.subscribe(null); }).toThrow();
			});

			it("When \"include\" and \"exclude\" options are not specified, subscribe to all properties", function() {
				var works = false;

				model.shelby.subscribe(function() {
					works = true;
				});

			 	model.prop1(dataSampler.generateString(10));

			 	expect(works).toBeTruthy();
			 	expect(model.shelby._delegatedSubscriptions[keys(model.shelby._delegatedSubscriptions)[0]].members.length).toBe(modelPropertyCount);
			});

			it("Can subscribe to deep properties", function() {
				var prop3Called = false,
					prop4Called = false;

				model.shelby.subscribe(function(args) {
					if (args.path === "{root}.nestedProp.prop3") {
						prop3Called = true;
					}
					else if (args.path === "{root}.nestedProp.prop4") {
						prop4Called = true;
					}
				});

				model.nestedProp.prop3(dataSampler.generateString(10));
				model.nestedProp.prop4(dataSampler.generateString(10));

				expect(prop3Called).toBeTruthy();
				expect(prop4Called).toBeTruthy();
			});

			it("Can subscribe to deep properties contained in array", function() {
				var prop5Called = false,
					prop6Called = false;

				model.shelby.subscribe(function(args) {
					if (args.path === "{root}.array[i].prop5") {
						prop5Called = true;
					}
					else if (args.path === "{root}.array[i].prop6") {
						prop6Called = true;
					}
				});

				model.array.peek()[0].prop5(dataSampler.generateString(10));
				model.array.peek()[0].prop6(dataSampler.generateString(10));

				expect(prop5Called).toBeTruthy();
				expect(prop6Called).toBeTruthy();
			});

			it("When the \"include\" options is specified, the callback is called only when a property to include is updated", function() {
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
				}, {
					include: ["{root}.prop1", "{root}.nestedProp.prop3", "{root}.array[i].prop5"]
				});

				model.prop1(dataSampler.generateString(10));
				model.prop2(dataSampler.generateString(10));
				model.nestedProp.prop3(dataSampler.generateString(10));
				model.nestedProp.prop4(dataSampler.generateString(10));
				model.array.peek()[0].prop5(dataSampler.generateString(10));
				model.array.peek()[0].prop6(dataSampler.generateString(10));

				expect(prop1Called).toBeTruthy();
				expect(prop2Called).toBeFalsy();
				expect(prop3Called).toBeTruthy();
				expect(prop4Called).toBeFalsy();
				expect(prop5Called).toBeTruthy();
				expect(prop6Called).toBeFalsy();
			});

			it("When the \"include\" options is specified for an array, the callback is called when an item is added or removed from the array but is not called when an array item is modified.", function() {
				var prop5Called = false,
					prop6Called = false,
					arrayNewItemCalled = false;

				model.shelby.subscribe(function(args) {
					if (args.path === "{root}.array[i].prop5") {
						prop5Called = true;
					}
					else if (args.path === "{root}.array[i].prop6") {
						prop6Called = true;
					}
					else if (args.path === "{root}.array") {
						arrayNewItemCalled = true;
					}
				}, {
					include: ["{root}.array"]
				});

				model.array.peek()[0].prop5(dataSampler.generateString(10));
				model.array.peek()[0].prop6(dataSampler.generateString(10));
				model.array.push(dataSampler.generateString(10));

				expect(prop5Called).toBeFalsy();
				expect(prop6Called).toBeFalsy();
				expect(arrayNewItemCalled).toBeTruthy();
			});

			it("When the \"include\" options is specified for the items of an array, the callback is called when any array's item are updated but is not called when an item is added or removed from the array.", function() {
				var prop5Called = false,
					prop6Called = false,
					arrayNewItemCalled = false;

				model.shelby.subscribe(function(args) {
					if (args.path === "{root}.array[i].prop5") {
						prop5Called = true;
					}
					else if (args.path === "{root}.array[i].prop6") {
						prop6Called = true;
					}
					else if (args.path === "{root}.array") {
						arrayNewItemCalled = true;
					}
				}, {
					include: ["{root}.array[i]"]
				});

				model.array.peek()[0].prop5(dataSampler.generateString(10));
				model.array.peek()[0].prop6(dataSampler.generateString(10));
				model.array.push(dataSampler.generateString(10));

				expect(prop5Called).toBeTruthy();
				expect(prop6Called).toBeTruthy();
				expect(arrayNewItemCalled).toBeFalsy();
			});

			it("When the \"include\" options is specified for a specific array items property, the callback is called only when this specific property is updated", function() {
				var prop5Called = false,
					prop6Called = false;

				model.shelby.subscribe(function(args) {
					if (args.path === "{root}.array[i].prop5") {
						prop5Called = true;
					}
					else if (args.path === "{root}.array[i].prop6") {
						prop6Called = true;
					}
				}, {
					include: ["{root}.array[i].prop5"]
				});

				model.array.peek()[0].prop5(dataSampler.generateString(10));
				model.array.peek()[0].prop6(dataSampler.generateString(10));

				expect(prop5Called).toBeTruthy();
				expect(prop6Called).toBeFalsy();
			});

			it("When the \"exclude\" options is specified, the callback is called only when a property that is not excluded is updated", function() {
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
				}, {
					exclude: ["{root}.prop1", "{root}.nestedProp.prop3", "{root}.array[i].prop5"]
				});

				model.prop1(dataSampler.generateString(10));
				model.prop2(dataSampler.generateString(10));
				model.nestedProp.prop3(dataSampler.generateString(10));
				model.nestedProp.prop4(dataSampler.generateString(10));
				model.array.peek()[0].prop5(dataSampler.generateString(10));
				model.array.peek()[0].prop6(dataSampler.generateString(10));

				expect(prop1Called).toBeFalsy();
				expect(prop2Called).toBeTruthy();
				expect(prop3Called).toBeFalsy();
				expect(prop4Called).toBeTruthy();
				expect(prop5Called).toBeFalsy();
				expect(prop6Called).toBeTruthy();
			});

			it("When the \"exclude\" options is specified for an array, the callback is not called when an item is added or removed from the array but is called when an array item is updated.", function() {
				var prop5Called = false,
					prop6Called = false,
					arrayNewItemCalled = false;

				model.shelby.subscribe(function(args) {
					if (args.path === "{root}.array[i].prop5") {
						prop5Called = true;
					}
					if (args.path === "{root}.array[i].prop6") {
						prop6Called = true;
					}
					else if (args.path === "{root}.array") {
						arrayNewItemCalled = true;
					}
				}, {
					exclude: ["{root}.array"]
				});

				model.array.peek()[0].prop5(dataSampler.generateString(10));
				model.array.peek()[0].prop6(dataSampler.generateString(10));
				model.array.push(dataSampler.generateString(10));

				expect(prop5Called).toBeTruthy();
				expect(prop6Called).toBeTruthy();
				expect(arrayNewItemCalled).toBeFalsy();
			});

			it("When the \"exclude\" options is specified for the items of an array, the callback is not called when any array's item are updated but is called when an item is added or removed from the array", function() {
				var prop5Called = false,
					prop6Called = false,
					arrayNewItemCalled = false;

				model.shelby.subscribe(function(args) {
					if (args.path === "{root}.array[i].prop5") {
						prop5Called = true;
					}
					if (args.path === "{root}.array[i].prop6") {
						prop6Called = true;
					}
					else if (args.path === "{root}.array") {
						arrayNewItemCalled = true;
					}
				}, {
					exclude: ["{root}.array[i]"]
				});

				model.array.peek()[0].prop5(dataSampler.generateString(10));
				model.array.peek()[0].prop6(dataSampler.generateString(10));
				model.array.push(dataSampler.generateString(10));

				expect(prop5Called).toBeFalsy();
				expect(prop6Called).toBeFalsy();
				expect(arrayNewItemCalled).toBeTruthy();				
			});

			it("When the \"include\" and \"exclude\" options are both specified, the \"include\" options is used", function() {
				var prop1Called = false;

				model.shelby.subscribe(function(args) {
					if (args.path === "{root}.prop1") {
						prop1Called = true;
					}
				}, {
					include: ["{root}.prop1"],
					exclude: ["{root}.prop1"]
				});

				model.prop1(dataSampler.generateString(10));

				expect(prop1Called).toBeTruthy();
			});

			it("When the \"subscriber\" options is specified, call the specified subscriber everytime a property is subscribed to", function() {
				var count = 0;

				model.shelby.subscribe($.noop, {
					subscriber: function() {
						count += 1;
					}
				});

				expect(count).toBe(modelPropertyCount);
			});

			it("When the \"array.evaluateChanges\" options is false, do not evaluate the array changes when items are added or removed from the array", function() {
				var works = false;

				model.shelby.subscribe(function(args) {
					if (areEquals(model.array.peek(), args.value)) {
						works = true;
					}
				}, {
					array: {
						evaluateChanges: false
					}
				});

				model.array.push({
					prop1: dataSampler.generateString(10)
				});

				expect(works).toBeTruthy();
			});

			describe("Always returns an object having the subscription", function() {
				var subscription = null;

				beforeEach(function() {
					subscription = model.shelby.subscribe($.noop);
				});

				it("Id", function() {
					expect(subscription.id).not.toBeNull();
					expect(subscription.id).not.toBeUndefined();
					expect(subscription.id).not.toBe("");
				});

				it("Members", function() {
					expect(subscription.members.length).toBe(modelPropertyCount);
				});

				it("IsPause flag", function() {
					expect(subscription.isPause).toBeFalsy();
				});

				it("Callback", function() {
					expect($.isFunction(subscription.callback)).toBeTruthy();
				});

				it("Pause function", function() {
					expect($.isFunction(subscription.pause)).toBeTruthy();
				});

				it("Resume function", function() {
					expect($.isFunction(subscription.resume)).toBeTruthy();
				});

				it("Dispose function", function() {
					expect($.isFunction(subscription.dispose)).toBeTruthy();
				});
			});

			describe("When a subscription callback is called, arguments contains", function() {
				it("The new value - When simple property", function() {
					model.shelby.subscribe(function(args) {
						expect(args.value).toBe("Prop 1 new value");
					});

					model.prop1("Prop 1 new value");
				});

				it("The new value - When array property", function() {
					model.shelby.subscribe(function(args) {
						expect(args.value[0].status).toBe("added");
						expect(args.value[0].value).toBe("New array value");
					});

					model.array.push("New array value");
				});

				it("The property path", function() {
					model.shelby.subscribe(function(args) {
						expect(args.path).toBe("{root}.prop1");
					});

					model.prop1(dataSampler.generateString(10));
				});

				it("The property immediate parent", function() {
					model.shelby.subscribe(function(args) {
						if (args.path === "{root}.prop1") {
							expect(areEquals(args.parent, model)).toBeTruthy();
						}
						else if (args.path === "{root}.nestedProp.prop3") {
							expect(areEquals(args.parent, model.nestedProp)).toBeTruthy();
						}
						else if (args.path === "{root}.array[i].prop5") {
							expect(areEquals(args.parent, model.array.peek()[0])).toBeTruthy();
						}
					});

					model.prop1(dataSampler.generateString(10));
					model.nestedProp.prop3(dataSampler.generateString(10));
					model.array.peek()[0].prop5(dataSampler.generateString(10));
				});

				it("The subscription's informations", function() {
					var subscription = model.shelby.subscribe(function(args) {
						expect(areEquals(args.subscription, subscription)).toBeTruthy();
					});

					model.prop1(dataSampler.generateString(10));
				});
			});

			it("When a subscription is paused, all the subscription properties are paused", function() {
				var works = true;

				var subscription = model.shelby.subscribe(function(args) {
					works = false;
				});

				subscription.pause();

				model.prop1(dataSampler.generateString(10));
				model.prop2(dataSampler.generateString(10));
				model.nestedProp.prop3(dataSampler.generateString(10));
				model.nestedProp.prop4(dataSampler.generateString(10));
				model.array.peek()[0].prop5(dataSampler.generateString(10));
				model.array.peek()[0].prop6(dataSampler.generateString(10));
				model.array.push(dataSampler.generateString(10));

				expect(works).toBeTruthy();
			});

			it("When a subscription is paused, only the targeted subscription is paused", function() {
				var subscription1Called = false,
					subscription2Called = false,
					subscription3Called = false;

				var subscription1 = model.shelby.subscribe(function(args) {
					subscription1Called = true;
				});

				var subscription2 = model.shelby.subscribe(function(args) {
					subscription2Called = true;
				});

				var subscription3 = model.shelby.subscribe(function(args) {
					subscription3Called = true;
				});

				subscription2.pause();

				model.prop1(dataSampler.generateString(10));

				expect(subscription1Called).toBeTruthy();
				expect(subscription2Called).toBeFalsy();
				expect(subscription3Called).toBeTruthy();
			});

			it("When a subscription is resumed, all the subscription properties are resumed", function() {
				var works = false;

				var subscription = model.shelby.subscribe(function(args) {
					works = true;
				});

				subscription.pause();
				subscription.resume();

				model.prop1(dataSampler.generateString(10));
				model.prop2(dataSampler.generateString(10));
				model.nestedProp.prop3(dataSampler.generateString(10));
				model.nestedProp.prop4(dataSampler.generateString(10));
				model.array.peek()[0].prop5(dataSampler.generateString(10));
				model.array.peek()[0].prop6(dataSampler.generateString(10));
				model.array.push(dataSampler.generateString(10));

				expect(works).toBeTruthy();
			});

			it("When a subscription is resumed, only the targeted subscription is resumed", function() {
				var subscription1Called = false,
					subscription2Called = false,
					subscription3Called = false;

				var subscription1 = model.shelby.subscribe(function(args) {
					subscription1Called = true;
				});

				var subscription2 = model.shelby.subscribe(function(args) {
					subscription2Called = true;
				});

				var subscription3 = model.shelby.subscribe(function(args) {
					subscription3Called = true;
				});

				subscription1.pause();
				subscription2.pause();
				subscription3.pause();

				subscription2.resume();

				model.prop1(dataSampler.generateString(10));

				expect(subscription1Called).toBeFalsy();
				expect(subscription2Called).toBeTruthy();
				expect(subscription3Called).toBeFalsy();
			});

			it("When the subscription is paused, \"isPause\" return true", function() {
				var subscription = model.shelby.subscribe($.noop);
				subscription.pause();

				expect(subscription.isPause).toBeTruthy();
			});

			it("When the subscription is not paused, \"isPause\" return false", function() {
				var subscription = model.shelby.subscribe($.noop);

				expect(subscription.isPause).toBeFalsy();
			});

			it("When the subscription is disposed, native knockout subscription is disposed", function() {
				var subscription = model.shelby.subscribe($.noop);
				subscription.dispose();

				// SUR ARRAY IL RESTE UN ÉVÉNEMENT "CHANGE" DANS _SUBSCRIPTIONS

				expect(model.prop1._subscriptions.change.length).toBe(0);
				expect(model.prop2._subscriptions.change.length).toBe(0);
				expect(model.nestedProp.prop3._subscriptions.change.length).toBe(0);
				expect(model.nestedProp.prop4._subscriptions.change.length).toBe(0);
				expect(model.array._subscriptions.arrayChange.length).toBe(0);
				expect(model.array.peek()[0].prop5._subscriptions.change.length).toBe(0);
				expect(model.array.peek()[0].prop6._subscriptions.change.length).toBe(0);
				expect(subscription.members.length).toBe(0);
			});

			it("When the subscription is disposed, the subscriptions is removed from the delegated subscriptions repository", function() {
				var subscription1 = model.shelby.subscribe($.noop),
					subscription2 = model.shelby.subscribe($.noop);

				subscription1.dispose();

				expect(model.shelby._delegatedSubscriptions[subscription1.id]).toBeUndefined();
				expect(model.shelby._delegatedSubscriptions[subscription2.id]).not.toBeUndefined();
			});

			it("Always save the subscription informations", function() {
				var subscription1 = model.shelby.subscribe($.noop),
					subscription2 = model.shelby.subscribe($.noop);

				expect(model.shelby._delegatedSubscriptions[subscription1.id]).not.toBeUndefined();
				expect(model.shelby._delegatedSubscriptions[subscription2.id]).not.toBeUndefined();
			});

			describe("Array automatic subscription", function() {
				var newItem = null;

				beforeEach(function() {
					newItem = {
						prop1: ko.observable(dataSampler.generateString(10))
					};

					Shelby.components.propertyExtender().add(newItem, {
						"*": {
							"subscribe": Shelby.Extenders.subscribe
						}
					});
				});

				it("When a new item is added to an array, automatically add the new item to the subscription", function() {
					var works = false;

					var subscription = model.shelby.subscribe(function(args) {
						if (args.value === "New value") {
							works = true;
						}
					});

					var membersCountBefore = subscription.members.length;

					model.array.push(newItem);
					model.array.peek()[1].prop1("New value");

					expect(works).toBeTruthy();
					expect(membersCountBefore + 1).toBe(subscription.members.length);
				});

				it("When a new item is removed from an array, automatically remove the item from the subscription", function() {
					var subscription = model.shelby.subscribe($.noop);
					var membersCountBefore = subscription.members.length;

					model.array.pop();

					// "-2" because the first array item contains 2 subscriptions.
					expect(membersCountBefore - 2).toBe(subscription.members.length);
				});

				it("When a new item that do not match the specified \"include\" option is added to an array, do not add the item to the subscription", function() {
					var works = true;

					var subscription = model.shelby.subscribe(function(args) {
						if (args.value === "New value") {
							works = false;
						}
					}, {
						include: ["{root}.array[i].prop5", "{root}.array[i].prop6"]
					});

					var membersCountBefore = subscription.members.length;

					model.array.push(newItem);
					model.array.peek()[1].prop1("New value");

					expect(works).toBeTruthy();
					expect(membersCountBefore).toBe(subscription.members.length);
				});

				describe("When the array itself is not specified in the \"include\" options and array's items are", function() {
					 it("Items added to the array are automatically registred", function() {
						var works = false;

						var subscription = model.shelby.subscribe(function(args) {
							if (args.value === "New value") {
								works = true;
							}
						}, {
							include: ["{root}.array[i].prop1"]
						});

						model.array.push(newItem);
						model.array.peek()[1].prop1("New value");

						expect(works).toBeTruthy();
					});

					 it("There is no subscription on the array itself", function() {
						var works = true;

						var subscription = model.shelby.subscribe(function(args) {
							works = false;
						}, {
							include: ["{root}.array[i].prop1"]
						});

						model.array.push(newItem);

						expect(works).toBeTruthy();
					 });
				});

				it("When a new item that match the specified \"exclude\" option is added to an array, do not add the item to the subscription", function() {
					var works = true;

					var subscription = model.shelby.subscribe(function(args) {
						if (args.value === "New value") {
							works = false;
						}
					}, {
						exclude: ["{root}.array[i].prop1"]
					});

					var membersCountBefore = subscription.members.length;

					model.array.push(newItem);
					model.array.peek()[1].prop1("New value");

					expect(works).toBeTruthy();
					expect(membersCountBefore).toBe(subscription.members.length);
				});

				it("When \"array.trackChildren\" option is false, do not automatically add or remove array's item from the subscription", function() {
					var works = true;
					
					var subscription = model.shelby.subscribe(function(args) {
						if (args.value === "New value") {
							works = false;
						}
					}, {
						array: {
							trackChildren: false
						}
					});

					var membersCountBefore = subscription.members.length;

					model.array.push(newItem);
					model.array.peek()[1].prop1("New value");

					expect(works).toBeTruthy();
					expect(membersCountBefore).toBe(subscription.members.length);
				});

				it("Items added automatically use original subscription options", function() {
					var works = true;

					var subscription = model.shelby.subscribe(function(args) {
						if (args.value === "New value") {
							works = false;
						}
					}, {
						exclude: ["{root}.array[i].array2[i].prop1"]
					});

					var newArrayItem = {
						array2: ko.observableArray([])
					};

					Shelby.components.propertyExtender().add(newArrayItem, {
						"*": {
							"subscribe": Shelby.Extenders.subscribe
						}
					});

					model.array.push(newArrayItem);

					var membersCountBefore = subscription.members.length;

					model.array.peek()[1].array2.push(newItem);
					model.array.peek()[1].array2.peek()[0].prop1("New value");

					expect(works).toBeTruthy();
					expect(membersCountBefore).toBe(subscription.members.length);
				});
			});
		});

		describe("unsuscribeAll", function() {
			var subscription1 = null,
				subscription2 = null,
				subscription3 = null;

			beforeEach(function() {
				subscription1 = model.shelby.subscribe($.noop);
				subscription2 = model.shelby.subscribe($.noop);
				subscription3 = model.shelby.subscribe($.noop);
			});

			it("All the model subscriptions are cleared", function() {
				model.shelby.unsuscribeAll();

				expect(model.shelby._delegatedSubscriptions[subscription1.id]).toBeUndefined();
				expect(model.shelby._delegatedSubscriptions[subscription2.id]).toBeUndefined();
				expect(model.shelby._delegatedSubscriptions[subscription3.id]).toBeUndefined();
			});

			it("All the subscription members are cleared", function() {
				model.shelby.unsuscribeAll();

				expect(subscription1.members.length).toBe(0);
				expect(subscription2.members.length).toBe(0);
				expect(subscription3.members.length).toBe(0);
			});

			it("All the native knockout subscriptions are disposed", function() {
				model.shelby.unsuscribeAll();

				// SUR ARRAY IL RESTE UN ÉVÉNEMENT "CHANGE" DANS _SUBSCRIPTIONS

				expect(model.prop1._subscriptions.change.length).toBe(0);
				expect(model.prop2._subscriptions.change.length).toBe(0);
				expect(model.nestedProp.prop3._subscriptions.change.length).toBe(0);
				expect(model.nestedProp.prop4._subscriptions.change.length).toBe(0);
				expect(model.array._subscriptions.arrayChange.length).toBe(0);
				expect(model.array.peek()[0].prop5._subscriptions.change.length).toBe(0);
				expect(model.array.peek()[0].prop6._subscriptions.change.length).toBe(0);
			});
		});

		describe("mute", function() {
			it("All the subscriptions callbacks are not called", function() {
				var subscription1Called = false,
					subscription2Called = false,
					subscription3Called = false;

				model.shelby.subscribe(function() {
					subscription1Called = true;
				});

				model.shelby.subscribe(function() {
					subscription2Called = true;
				});

				model.shelby.subscribe(function() {
					subscription3Called = true;
				});

				model.shelby.mute();

				model.prop1(dataSampler.generateString(10));

				expect(subscription1Called).toBeFalsy();
				expect(subscription2Called).toBeFalsy();
				expect(subscription3Called).toBeFalsy();
			});
		});

		describe("unmute", function() {
			it("All the subscriptions callbacks are called", function() {
				var subscription1Called = false,
					subscription2Called = false,
					subscription3Called = false;

				model.shelby.subscribe(function() {
					subscription1Called = true;
				});

				model.shelby.subscribe(function() {
					subscription2Called = true;
				});

				model.shelby.subscribe(function() {
					subscription3Called = true;
				});

				model.shelby.mute();
				model.shelby.unmute();

				model.prop1(dataSampler.generateString(10));

				expect(subscription1Called).toBeTruthy();
				expect(subscription2Called).toBeTruthy();
				expect(subscription3Called).toBeTruthy();
			});
		});
	});
})(jQuery);