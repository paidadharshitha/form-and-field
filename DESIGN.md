# Form & Field visual system

The catalogue is a task-focused surface with the quiet character of an independent department store. Warm paper, forest-green controls, serif display typography, and generously spaced product photographs give the collection a consistent identity without competing with product names and prices.

- Display: self-hosted DM Serif Display. Interface: self-hosted DM Sans.
- Background: #fcfbf8. Primary ink: #252c27. Accent: #254b3f.
- Desktop: bounded page width, persistent category/price sidebar, three-column product grid.
- Phone: two-column product grid, visible search/sort, filters in a native modal dialog with keyboard focus management.
- An optional list layout adds readable descriptions while preserving the same product actions and filter state.
- Illustrated category shortcuts use actual catalogue product images and act as category controls. They inherit the warm neutral image surfaces and green interaction cues.
- Product images and titles open quick view. Heart controls save a product, and a separate comparison control makes the two actions distinct. Selected states use shape, text, and pressed semantics in addition to color.
- A compact comparison tray appears after selection and supports at most three products. The detail table remains inside a horizontally scrollable region on small screens.
- Quick view and comparison use the same dialog system, with native focus containment and explicit close controls. Their content uses supplied product metadata and the same price/rating typography as the catalogue.
- The Saved view is part of the existing results area, with an empty collection state and clear wording when persistence is unavailable.
- Product names wrap; price/rating figures use tabular numerals. All controls have focus states, and motion respects reduced-motion preferences.
- Loading, error/retry, invalid range, no-match, empty wishlist, comparison limits, and unavailable images are intentional parts of the same surface.
- Search suggestions sit directly below the search field, with product images and prices, keyboard navigation, and an explicit close-match explanation for typo results. Brand uses the existing native-select vocabulary.
- Quick view's gallery keeps photo selection and zoom inside the same dialog. Similar products and recently viewed reuse a compact horizontal product strip; history sits below the main catalogue so returning-visit features do not crowd primary discovery.

The optional Impeccable context/seed launcher was unavailable in this environment. The direction follows the supplied professional catalogue brief.
