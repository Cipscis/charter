define(
	[
		'/charter/app/docs/activate.js',
		'/charter/app/docs/keybinding.js'
	],

	function (activate, keys) {
		const menu = (function () {
			const selectors = {
				menu: '.js-menu',
				toggle: '.js-menu-toggle',
				link: '.js-menu-link',

				search: '.js-menu-search',
				searchBody: '.js-menu-search-body'
			};

			const classes = {
				disabled: 'docs-nav__item--disabled',
				match: 'docs-nav__item--match'
			};

			const States = {
				OPENED: 'OPENED',
				CLOSED: 'CLOSED'
			};

			const module = {
				init: {
					init: function () {
						module.init._initEvents();
						module.init._initShortcuts();
					},

					_initEvents: function () {
						let $menus = document.querySelectorAll(selectors.menu);

						$menus.forEach($menu => {
							activate($menu.querySelectorAll(selectors.toggle), module.state.toggleEvent);

							// Clicking a link is only possible when the menu is open,
							// so toggling it in response to this will always close it
							activate($menu.querySelectorAll(selectors.link), module.state.toggleEvent);

							$menu.querySelectorAll(selectors.search).forEach($search => {
								$search.addEventListener('input', module.search.doSearchEvent);
								$search.addEventListener('keydown', module.search.clickFirstResultEvent);
							});
						});
					},

					_initShortcuts: function () {
						keys.bind('m', module.state.toggleFirstMenu, false, true);
						keys.bind('escape', module.state.closeOpenMenus, true);

						keys.bind('/', module.search.focusOnSearch, false, true);
					}
				},
				state: {
					toggleFirstMenu: function (e) {
						e.preventDefault();

						let $menu = document.querySelector(selectors.menu);
						module.state._toggle($menu);

						$menu.querySelector(selectors.toggle).focus();

						return $menu;
					},

					closeOpenMenus: function () {
						let $menus = Array.from(document.querySelectorAll(selectors.menu)).filter($menu => module.state.get($menu) === States.OPENED);

						$menus.forEach($menu => module.state.set($menu, States.CLOSED));
					},

					toggleEvent: function (e) {
						let $toggle = e.target;
						let $menu = $toggle;

						while ($menu.matches(selectors.menu) === false) {
							$menu = $menu.parentElement;
							if ($menu === null) {
								return;
							}
						}

						module.state._toggle($menu);
					},

					_toggle: function ($menu) {
						let state = module.state.get($menu);

						if (state === States.OPENED) {
							module.state.set($menu, States.CLOSED);
						} else {
							module.state.set($menu, States.OPENED);
						}
					},

					get: function ($menu) {
						let state = States.CLOSED;

						if ($menu.getAttribute('aria-expanded') === 'true') {
							state = States.OPENED;
						}

						return state;
					},

					set: function ($menu, state) {
						let oldState = module.state.get($menu);
						if (state !== oldState) {
							switch (state) {
								case States.OPENED:
									$menu.setAttribute('aria-expanded', true);
									module.search.clear($menu);
									break;
								case States.CLOSED:
									$menu.setAttribute('aria-expanded', false);
									break;
								default:
									break;
							}
						}
					}
				},
				search: {
					focusOnSearch: function (e) {
						let $menu = document.querySelector(selectors.menu);
						let $search = $menu.querySelector(selectors.search);

						module.state.set($menu, States.OPENED);

						$search.focus();
						$search.select();
					},

					doSearchEvent: function (e) {
						let $search = e.target;
						let query = $search.value;
						let $menu = $search;

						while ($menu.matches(selectors.menu) === false) {
							$menu = $menu.parentElement;
							if ($menu === null) {
								return;
							}
						}

						module.search._doSearch($menu, query);
					},

					_doSearch: function ($menu, query) {
						let $items = $menu.querySelectorAll(selectors.link);
						let $resultItems = [];

						query = query.toLowerCase().trim();
						let hasQuery = query !== '';

						$items.forEach($item => {
							let text = $item.innerText.toLowerCase();
							let match = text.match(query);

							if (match !== module.search._isDisabled($item)) {
								if (match) {
									module.search._enableItem($item, hasQuery);
									$resultItems.push($item);
								} else {
									module.search._disableItem($item);
								}
							}
						});

						$resultItems.forEach($item => {
							module.search._enableAncestors($item);
							module.search._enableDescendants($item);
						});

					},

					_enableAncestors: function ($item) {
						// Up three levels: list item, list, parent list item
						let $ancestor = $item.parentElement.parentElement.parentElement;

						if ($ancestor.matches(selectors.searchBody) === false) {
							$ancestor = $ancestor.querySelector(selectors.link);
							if ($ancestor !== $item && module.search._isDisabled($ancestor)) {
								module.search._enableItem($ancestor);
								module.search._enableAncestors($ancestor);
							}
						}
					},
					_enableDescendants: function ($item) {
						// Up one level: list item
						let $descendants = $item.parentElement.querySelectorAll(selectors.link);

						$descendants.forEach($descendant => {
							if ($descendant !== $item && module.search._isDisabled($descendant)) {
								module.search._enableItem($descendant);
								module.search._enableDescendants($descendant);
							}
						});
					},

					_disableItem: function ($item) {
						$item.classList.add(classes.disabled);
						if ($item.classList.contains(classes.match)) {
							$item.classList.remove(classes.match);
						}
						$item.setAttribute('aria-disabled', true);
						$item.setAttribute('tabindex', -1);
					},
					_enableItem: function ($item, match) {
						$item.classList.remove(classes.disabled);
						if (match === true) {
							$item.classList.add(classes.match);
						} else if ($item.classList.contains(classes.match)) {
							$item.classList.remove(classes.match);
						}
						$item.removeAttribute('aria-disabled');
						$item.removeAttribute('tabindex');
					},
					_isDisabled: function ($item ) {
						return $item.classList.contains(classes.disabled);
					},

					clear: function ($menu) {
						let $searches = $menu.querySelectorAll(selectors.search);

						$searches.forEach($search => $search.value = '');
						module.search._doSearch($menu, '');
					},

					clickFirstResultEvent: function (e) {
						let $search = e.target;
						let $menu = $search;

						if (e.key === 'Enter') {

							while ($menu.matches(selectors.menu) === false) {
								$menu = $menu.parentElement;
								if ($menu === null) {
									return;
								}
							}

							module.search._clickFirstResult($menu);

						}
					},

					_clickFirstResult: function ($menu) {
						let $items = Array.from($menu.querySelectorAll(selectors.link));
						let $results = $items.filter($item => module.search._isDisabled($item));

						$results[0].click();
					}
				}
			};

			return {
				init: module.init.init
			};
		})();

		return menu;
	}
);