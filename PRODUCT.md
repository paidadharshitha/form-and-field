# Form & Field

A single-page product catalogue for people who need to find the right item among a few hundred products. Success means search, category, price, rating, availability, and sort combine predictably on phones and laptops, with useful detail and comparison tools supporting the decision.

The supplied data source is DummyJSON Products. All product content comes from the live API; no checkout, accounts, or persistence service is required. The user requested a professional finish, readable code, a README, a public GitHub repository, and a deployed link.

The user subsequently requested additional features and a more impressive professional experience while retaining the single-page requirement. The enhanced surface includes product quick view, a wishlist, comparison of up to three products, grid/list layouts, illustrated category shortcuts, and rating/in-stock filters. These tools support finding and evaluating products; no purchase flow is implied.

Filter and sort state is shareable through URL parameters. Saved product IDs persist only in the current browser and synchronize across its tabs, with an in-memory fallback when storage fails. Comparison selections and view preferences are temporary. Quick view and comparison show supplied metadata; missing brands are identified as unspecified.

Stack: React, TypeScript, Vite, plain CSS, Vitest, Playwright. Pricing is displayed in USD, an explicit display assumption because the API has no currency field.

Discovery also includes keyboard-accessible product suggestions, conservative typo matching, and a brand filter. Quick view supports the supplied image gallery with zoom and same-category alternatives within 50% of the viewed price. The last eight explicitly opened products are remembered on this browser and shown below the catalogue, with a clear-history action. Sidebar category product counts remain omitted at the user's request.

The catalogue includes a category/budget/priority guided finder, actionable empty-result recovery, direct product links, sample API reviews, Undo for saved removals and history clearing, and exact search-term highlighting. All remain within the same page. Reviews exclude email addresses; copy-link failures offer a manual fallback; Undo persists until action or dismissal but not across reloads.

The latest user-selected direction is **warm luxury boutique — cream, charcoal, refined details**. It supersedes the previous white/cobalt theme. The opening combines expressive serif typography, immediately accessible search, and an asymmetric display of real product photography. Phones use a compact category row; product cards retain complete names, clear pricing, and accessible save/compare controls. This is a visual and layout refinement of the existing catalogue, without changing its product data or discovery rules.
