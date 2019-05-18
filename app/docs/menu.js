define(
	[
		'/charter/app/docs/activate.js'
	],

	function (activate) {
		const menu = (function () {
			const selectors = {
				menu: '.js-menu',
				toggle: '.js-menu-toggle'
			};

			const States = {
				OPENED: 'OPENED',
				CLOSED: 'CLOSED'
			};

			const module = {
				init: function () {
					module._initEvents();
				},

				_initEvents: function () {
					let $menus = document.querySelectorAll(selectors.menu);

					$menus.forEach($menu => {
						activate($menu.querySelectorAll(selectors.toggle), module._toggleEvent);
					});
				},

				_toggleEvent: function (e) {
					let $toggle = e.target;
					let $menu = $toggle;

					while ($menu.matches(selectors.menu) === false) {
						$menu = $menu.parentElement;
						if ($menu === null) {
							return;
						}
					}

					module._toggle($menu);
				},

				_toggle: function ($menu) {
					let state = module._getState($menu);

					if (state === States.OPENED) {
						module._setState($menu, States.CLOSED);
					} else {
						module._setState($menu, States.OPENED);
					}
				},

				_getState: function ($menu) {
					let state = States.CLOSED;

					if ($menu.getAttribute('aria-expanded') === 'true') {
						state = States.OPENED;
					}

					return state;
				},

				_setState: function ($menu, state) {
					switch (state) {
						case States.OPENED:
							$menu.setAttribute('aria-expanded', true);
							break;
						case States.CLOSED:
							$menu.setAttribute('aria-expanded', false);
							break;
						default:
							break;
					}
				}
			};

			return {
				init: module.init
			};
		})();

		// Self-initialise
		menu.init();
	}
);