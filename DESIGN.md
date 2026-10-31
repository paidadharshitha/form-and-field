# Form & Field visual system

The user selected a **clean white and cobalt blue** direction. The catalogue uses a bright, precise interface that keeps products and decisions prominent: crisp white surfaces, slate text, cobalt actions, and authentic product photography on pale neutral or blue image backgrounds.

## Foundations

| Role             | Token            | Value     |
| ---------------- | ---------------- | --------- |
| Canvas           | `--paper`        | `#ffffff` |
| Primary text     | `--ink`          | `#172033` |
| Secondary text   | `--muted`        | `#5d697c` |
| Primary action   | `--accent`       | `#2457e7` |
| Action hover     | `--accent-hover` | `#1742bd` |
| Selected surface | `--accent-soft`  | `#edf3ff` |
| Neutral surface  | `--surface`      | `#f5f7fb` |
| Image surface    | `--surface-blue` | `#f0f5ff` |
| Divider          | `--line`         | `#dce3ef` |
| Control boundary | `--line-strong`  | `#8391a8` |

The earlier green token names remain compatibility aliases to cobalt; they do not define a second palette. Emerald is reserved for stock availability, amber for rating symbols, and red for errors. Secondary text and action colors maintain at least 4.5:1 contrast on the shared white and pale surfaces.

All typography uses self-hosted **DM Sans**, with 400, 500, and 600 weights. Display and dialog headings use weight 600 and tight but readable tracking. Product names wrap, prices and ratings use tabular numerals, and the interface avoids tiny decorative labels. The brand name remains Form & Field.

## Composition

- A white sticky header holds the compact wordmark, catalogue navigation, and Saved control. Cobalt identifies the active navigation item and action states.
- The opening headline uses strong sans-serif typography. Illustrated category shortcuts provide direct entry points using actual catalogue product images.
- Search is the primary full-width discovery control. Suggestions stay attached to it, with real product images and prices, keyboard selection, and clear wording for close matches.
- Desktop uses a bounded content width, a persistent filter sidebar, and three product columns; large screens can show four columns. Phones keep two columns and place filters in a native dialog.
- Product cards use a light border and a 12–14px outer radius. Consistent neutral image surfaces give authentic product photography room to breathe, without tinting the images. Catalogue cards prefer the supplied detail photo, recover to the thumbnail on failure, and keep lazy loading.
- Full product titles lead the card, followed by a quiet brand/category line. A flex layout aligns prices, ratings, and footer controls across different title lengths. Prices carry more visual weight; save and comparison controls have 44px targets. Photo buttons retain a visible arrow affordance on touch screens and a detail label on desktop hover/focus. A selected comparison changes the card boundary to cobalt.
- List view uses separated rows with readable descriptions. It keeps the same actions and filters without nesting another card around each row.

## Decision tools and details

The guided finder, recommendation highlights, recovery suggestions, reviews, sharing controls, and undo feedback use the same tokens and type hierarchy. They support the main browsing task instead of creating a separate visual system. Forms use visible labels, native controls where practical, and compact action groups. Selected states have text or pressed semantics in addition to color.

Quick view, reviews, and comparison use white detail surfaces. Native dialogs contain focus and provide explicit close controls. Dialog headings use the same sans-serif voice as the page; descriptions and metadata use slate text. Gallery thumbnails, zoom controls, and selected photos use cobalt boundaries and pale surfaces.

The comparison tray appears only after products are selected. Its floating white surface uses a soft offset shadow; the table itself uses crisp dividers and remains horizontally scrollable inside its own region on phones. Lowest-price and highest-rating labels refer only to the currently selected products.

Similar products and recently viewed reuse compact bordered product strips with the same neutral photography and aligned prices. The recent-history section stays below the main catalogue. Wishlist, recent-history, and undo states clearly distinguish persistent browser storage from session-only fallback behavior.

## Interaction and states

- Primary buttons use cobalt with white text; secondary buttons use white or pale surfaces with cobalt text. Controls use 7–8px radii and visible keyboard focus.
- Cards use borders for separation. Shadows are reserved for floating suggestions, dialogs, trays, and feedback.
- Text selection, caret, scrollbars, and focus rings belong to the same palette. Product imagery remains authentic; no gradient text, decorative blur, or fabricated commercial promises are introduced.
- Loading, request failure, missing images, invalid ranges, empty results, empty saved items, comparison limits, and storage failures have deliberate states.
- Motion is restrained. Existing product transitions and the comparison tray entrance respect reduced-motion preferences.

The optional Impeccable context and concept launcher was unavailable in this environment. The selected direction comes directly from the user's white-and-cobalt choice.
