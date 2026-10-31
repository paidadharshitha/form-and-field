# Form & Field visual system

The user explicitly selected **warm luxury boutique**: cream, charcoal, and refined details. The catalogue pairs an editorial opening with fast product discovery. Warm neutral surfaces, expressive display typography, and authentic product photography create the character; search, filters, prices, and actions remain straightforward.

## Foundations

| Role                  | Token            | Value     |
| --------------------- | ---------------- | --------- |
| Canvas                | `--paper`        | `#f8f4ec` |
| Primary text          | `--ink`          | `#292621` |
| Secondary text        | `--muted`        | `#6c6054` |
| Primary action        | `--accent`       | `#292621` |
| Action hover          | `--accent-hover` | `#484034` |
| Selected surface      | `--accent-soft`  | `#e9e1d5` |
| Product image surface | `--surface`      | `#eee8df` |
| Quiet surface         | `--surface-soft` | `#f1ece3` |
| Decorative divider    | `--line`         | `#d9cfc1` |
| Control boundary      | `--line-strong`  | `#918272` |

Charcoal identifies primary actions and selected states. Muted forest green is reserved for availability, muted brown for rating symbols, and burgundy for errors. Small text maintains at least 4.5:1 contrast on the shared light surfaces; strong control boundaries maintain at least 3:1 against the canvas and image surface. The lighter divider token separates content rather than defining input boundaries.

Self-hosted **Cormorant Garamond**, weight 500 with an italic companion, gives display headings their editorial character. **DM Sans**, weights 400, 500, and 600, handles body copy, controls, product names, and numeric information. Product titles keep weight 600 and wrap in full. Prices and ratings use tabular numerals. The brand remains Form & Field.

## Composition

- A charcoal header anchors the wordmark, catalogue navigation, and Saved control in cream.
- The opening uses an asymmetric product stage instead of a row of equally weighted category boxes. Actual catalogue imagery and working category links make the composition useful as well as expressive.
- The main search sits with the headline. The guided finder is a quieter secondary entry point. Suggestions stay attached to the input, with actual product images and prices, keyboard selection, and clear wording for close matches.
- The mobile layout gives search priority and compresses the category imagery. Visitors can reach filters and products without scrolling past a large decorative hero.
- Desktop keeps a bounded content width, persistent filter sidebar, and three product columns; large screens can show four columns. Phones keep two columns and place filters in a native dialog.
- Product cards have open, borderless bodies. A warm image panel with a 4px radius holds the photo, while a fine line beneath the footer separates products. Related and recently viewed items follow the same open treatment.
- Full product titles lead each card, followed by a quiet brand/category line. Flex layouts align prices, ratings, and footer controls despite different title lengths. Prices carry more visual weight. Saved and comparison controls retain 44px targets.
- Photo buttons have a visible arrow affordance on touch screens and a details label on desktop hover or keyboard focus. Comparison selection adds a charcoal outline to the image panel and a pressed button state.
- List view preserves descriptions, actions, and filters in open rows. Photography, text, and spacing supply structure without enclosing each row in another box.

## Photography and detail views

Product photography comes from the supplied catalogue. Cards prefer the available detail photo, fall back to the thumbnail when needed, and keep lazy loading. Images use `object-fit: contain` and keep their original colors; blend modes do not tint merchandise to match the theme. No fabricated product images, commercial promises, discounts, or review claims are added.

Quick view, reviews, and comparison share the cream canvas, restrained dividers, and warm neutral photo panels. Native dialogs contain focus and have explicit close controls. Gallery thumbnails and selected photos use charcoal boundaries; zoom and horizontal scrolling remain available where appropriate.

The comparison tray appears only after products are selected. Its cream surface has a restrained shadow and fine boundary. The comparison table scrolls within its own region on phones. Lowest-price and highest-rating labels describe only the selected products.

## Interaction and states

- Primary buttons pair charcoal with cream text. Secondary controls use a strong warm border; forms and controls use restrained 2–5px radii and visible keyboard focus.
- Search, category, brand, price, rating, and stock filtering continue to work together. Sorting, list/grid views, saved products, history, and direct product links keep the same behavior.
- Guided choices, filter recovery, reviews, sharing, and undo support browsing within the same page. Selected states have text or pressed semantics in addition to color.
- Shadows are reserved for floating suggestions, dialogs, the comparison tray, and feedback. No gold glow, gradient treatment, or decorative blur is needed.
- Loading, request failure, missing images, invalid ranges, empty results, empty saved items, comparison limits, and storage failures have deliberate states. Storage messaging distinguishes browser persistence from session-only fallback.
- Motion is restrained, and existing transitions respect reduced-motion preferences.
