(function($, undefined) {
	"use strict";

	describe("Mediator.subscribe", function() {
		it("When callback is not a function, throw an exception", function() {
			expect(function() { Shelby.Mediator.subscribe(null); }).toThrow();
			expect(function() { Shelby.Mediator.subscribe(undefined); }).toThrow();
			expect(function() { Shelby.Mediator.subscribe({}); }).toThrow();
			expect(function() { Shelby.Mediator.subscribe(dataSampler.generateString(10)); }).toThrow();
		});

		it("When no \"channel\" is specified, subscribe to the global channel only", function() {
			var count = 0;

			Shelby.Mediator.subscribe(dataSampler.generateString(10), function() {
				count -= 1;
			});

			Shelby.Mediator.subscribe(function() {
				count += 1;
			});

			Shelby.Mediator.publish(dataSampler.generateString(10));
			Shelby.Mediator.publish(dataSampler.generateString(10));
			Shelby.Mediator.publish(dataSampler.generateString(10));

			expect(count).toBe(3);
		});

		it("When a \"channel\" is specified, subscribe only to this specific channel", function() {
			var count = 0,
				channel = dataSampler.generateString(10);

			Shelby.Mediator.subscribe(dataSampler.generateString(10), function() {
				count -= 1;
			});

			Shelby.Mediator.subscribe(channel, function() {
				count += 1;
			});

			Shelby.Mediator.publish(channel, dataSampler.generateString(10));
			Shelby.Mediator.publish(dataSampler.generateString(10));
			Shelby.Mediator.publish(channel, dataSampler.generateString(10));
			Shelby.Mediator.publish(dataSampler.generateString(10), dataSampler.generateString(10));
			Shelby.Mediator.publish(dataSampler.generateString(10), dataSampler.generateString(10));

			expect(count).toBe(2);
		});

		it("When a \"context\" is specified, it is used as the callback context", function() {
			var works = false;

			var context = {
				prop1: dataSampler.generateString(10)
			};

			Shelby.Mediator.subscribe(function() {
				works = areEquals(this, context);
			}, context);

			Shelby.Mediator.publish(dataSampler.generateString(10));

			expect(works).toBeTruthy();
		});

		describe("Always returns an object having the subscription", function() {
			it("Channel", function() {
				var channel = dataSampler.generateString(10);
				var subscription = Shelby.Mediator.subscribe(channel, $.noop);

				expect(subscription.channel).toBe(channel);
			});

			it("Unsuscribe function", function() {
				var subscription = Shelby.Mediator.subscribe($.noop);

				expect($.isFunction(subscription.unsuscribe)).toBeTruthy();
			});
		});

		it("When unsuscribed from a channel, the callback is not called when a publish happens on the channel", function() {
			var works = true,
				channel = dataSampler.generateString(10);

			var subscription = Shelby.Mediator.subscribe(function() {
				works = false;
			});

			subscription.unsuscribe();

			Shelby.Mediator.publish(channel, dataSampler.generateString(10));

			expect(works).toBeTruthy();
		});
	});

	describe("Mediator.publish", function() {
		it("When no \"channel\" is specified, publish to the global channel only", function() {
			var count = 0;

			Shelby.Mediator.subscribe(dataSampler.generateString(10), function() {
				count -= 1;
			});

			Shelby.Mediator.subscribe(function() {
				count += 1;
			});

			Shelby.Mediator.publish(dataSampler.generateString(10));

			expect(count).toBe(1);
		});

		it("When a \"channel\" is specified, publish only to the specified channel", function() {
			var count = 0,
				channel = dataSampler.generateString(10);

			Shelby.Mediator.subscribe(function() {
				count -= 1;
			});

			Shelby.Mediator.subscribe(channel, function() {
				count += 1;
			});

			Shelby.Mediator.publish(channel, dataSampler.generateString(10));

			expect(count).toBe(1);
		});
	});
})(jQuery);