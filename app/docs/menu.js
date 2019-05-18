define(
	[
		'/charter/app/docs/activate.js',
		'/charter/app/docs/keybinding.js'
	],

	function (activate, keys) {
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
					module._initShortcuts();
				},

				_initEvents: function () {
					let $menus = document.querySelectorAll(selectors.menu);

					$menus.forEach($menu => {
						activate($menu.querySelectorAll(selectors.toggle), module._toggleEvent);
					});
				},

				_initShortcuts: function () {
					keys.bind('m', module._openFirstMenu, false, true);
					keys.bind('escape', module._closeOpenMenus);
				},

				_openFirstMenu: function () {
					let $menu = document.querySelector(selectors.menu);
					module._toggle($menu);

					$menu.querySelector(selectors.toggle).focus();
				},

				_closeOpenMenus: function () {
					let $menus = Array.from(document.querySelectorAll(selectors.menu)).filter($menu => module._getState($menu) === States.OPENED);

					$menus.forEach($menu => module._setState($menu, States.CLOSED));
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

		return menu;
	}
);