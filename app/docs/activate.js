const activate = (function () {
	const bindings = [];

	const module = {
		activate: function (el, fn) {
			if (!el) {
				// el is falsey, so do nothing
				return;
			}

			if (typeof el === 'string') {
				el = document.querySelectorAll(el);
			}

			if (el.length && el.forEach) {
				// el is Array-like, so iterate over its elements
				el.forEach((el) => module.activate(el, fn));
				return;
			}

			module._bind(el, fn);
		},

		_bind: function (el, fn) {
			// Don't bind a function to an element more than once
			// (i.e. behave like addEventListener)
			if (module._isBound(el, fn) === false) {
				bindings.push({el, fn});

				// Click event always activates an element
				// Keydown on "enter" key activates an element unless it's a button
				// Keyup on "spacebar" key activates an element unless it's a button or an input

				el.addEventListener('click', fn);

				if (module._isButton(el) === false) {
					let fnKeydown = module._makeKeydownEvent(fn, module._isInput(el));
					el.addEventListener('keydown', fnKeydown);

					if (module._isInput(el) === false) {
						let fnKeyup = module._makeKeyupEvent(fn);
						el.addEventListener('keyup', fnKeyup);
					}
				}
			}
		},

		_isBound: function (el, fn) {
			for (let i = 0; i < bindings.length; i++) {
				let binding = bindings[i];
				if (binding[el] === el && binding[fn] === fn) {
					return true;
				}
			}

			return false;
		},

		_isButton: function (el) {
			// This selector should match all elements that will treat "enter" as a "click" event

			let isButton = el.matches('button, input[type="button"], input[type="submit"], a[href]');
			return isButton;
		},

		_isInput: function (el) {
			let isInput = el.matches('input, textarea, select') || el.isContentEditable;
			return isInput;
		},

		_makeKeydownEvent: function (fn, isInput) {
			// Keydown on "enter" key activates an element
			// Keydown on "spacebar" key on an activateable element should not scroll the page
			return function () {
				let enterEvent = module._makeKeySpecificEvent(fn, 'enter');
				let spaceEvent;

				enterEvent.apply(this, arguments);

				if (isInput === false) {
					// Prevent default action of spacebar to prevent scrolling on activation
					spaceEvent = module._makeKeySpecificEvent(e => e.preventDefault(), ' ', 'spacebar');
					spaceEvent.apply(this, arguments);
				}
			}
		},

		_makeKeyupEvent: function (fn) {
			// Keydown on "spacebar" key activates an element
			return module._makeKeySpecificEvent(fn, ' ', 'spacebar');
		},

		_makeKeySpecificEvent: function (fn, ...keys) {
			return function (event) {
				if (keys.includes(event.key.toLowerCase())) {
					fn.apply(this, arguments);
				}
			};
		}
	};

	return module.activate;
})();

export default activate;
