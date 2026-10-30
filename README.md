# Form & Field

A responsive product catalogue built to help people find the right item quickly. Search, category, and price filters work together, with clear sorting and recovery when no products match.

**Stack:** React, TypeScript, Vite, CSS, Vitest, and Playwright.

## Submission links

- [Public GitHub repository](https://github.com/paidadharshitha/form-and-field)
- [Live catalogue](https://paidadharshitha.github.io/form-and-field/)

![Desktop catalogue](docs/catalogue-desktop.png)

<img src="docs/catalogue-mobile.png" alt="The catalogue on a phone, with two-column product cards and a filter button" width="300" />

## Run locally

Use Node.js 24 and npm. No API key, environment variables, or backend setup are required.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The catalogue needs internet access to load products and their images from DummyJSON.

```sh
npm run build    # Type-check and create the production build in dist/
npm run preview  # Serve the production build locally
npm test         # Run the unit tests once
npm run format:check # Check consistent source formatting
```

For browser tests, install Playwright's Chromium browser once, then run the suite:

```sh
npx playwright install chromium
npm run test:e2e
```

## Using the catalogue

- **Search by name:** case-insensitive substring matching; surrounding whitespace is ignored.
- **Category:** choose one category or browse all products.
- **Price:** optional minimum and maximum prices, including both endpoints. Blank fields leave that end unrestricted. Invalid or reversed ranges show a helpful validation message.
- **Sort:** featured order, price low to high or high to low, and rating high to low or low to high. Equal values use product ID as a deterministic tie-breaker. Featured preserves the API's original order.
- **Combined filters:** every active condition must match. Removing a filter or clearing all filters restores results immediately.
- **Shareable state:** `q`, `category`, `min`, `max`, and `sort` are reflected in the URL so a filtered view can be bookmarked or shared.
- **Progressive display:** 24 matching products appear initially; load more to see the next group. Filtering always searches the full collection, including products not yet displayed.

Desktop puts filters in a persistent sidebar. Phones use the same filter controls inside a native dialog, with an explicit close action and keyboard dismissal. Loading, empty results, invalid prices, and request failures each have a distinct state.

## Decisions and trade-offs

### Fetch the whole catalogue, then filter locally

[DummyJSON's products endpoint](https://dummyjson.com/docs/products) returns only 30 items by default. The application requests `limit=0` and selects the fields it needs, so searching and filtering cover the entire catalogue. Categories and their counts are derived from the returned data rather than maintained as a separate list.

For a few hundred items, a single fetch and a local filter/sort pipeline keep interactions immediate and make combined conditions straightforward. This deliberately avoids server requests on every keystroke. For a much larger catalogue, I would move filtering, sorting, and pagination to an API with matching semantics, plus request cancellation and caching.

### Keep state and business rules small

React owns the interface state without an additional state-management library. `src/lib/catalogue.ts` contains the shared product types, response validation, category derivation, price validation, and pure filtering/sorting functions. Components render those results rather than duplicating the selection logic. The desktop and mobile interfaces share the same filter component.

External JSON is validated before rendering. Fetch errors are visible and retryable; there is no hardcoded fallback catalogue that could disguise an unavailable data source. Products and images therefore remain dependent on DummyJSON's availability.

### Make the catalogue easy to scan

The visual direction pairs warm neutrals and forest green with a serif heading and a restrained sans-serif interface. Product images, names, prices, and ratings lead the card hierarchy. Labels, focus indicators, native form controls, a mobile dialog, and responsive spacing support keyboard and small-screen use. Images load lazily where appropriate, and showing products in groups limits the initial DOM and image workload.

Prices use **USD as a display assumption**: the API provides a numeric price without an explicit currency field. Prices are shown directly from the API; the application does not calculate an additional discount.

### Stay within the task

This is a catalogue, not a checkout flow. There is no cart, account, payment integration, or invented shipping promise. The focus is accurate discovery and a polished experience on phones and laptops.

## Verification

The automated checks focus on behavior: combining filters, inclusive price boundaries, search normalization, deterministic sorting, malformed API data, and the main catalogue interactions. Browser tests exercise the desktop and mobile experience. They use controlled API responses so failures can be reproduced without depending on the live dataset changing.

Verified locally: **43 unit tests**, **25 browser tests**, and **2 opt-in live API smoke tests** pass. Automated axe checks found no WCAG A/AA violations on the desktop page, phone page, or phone filter dialog. This is an automated check of those states, not a claim of comprehensive accessibility certification.

The normal browser run skips the live API tests and the phone-only dialog test on desktop. To run the live smoke checks (which also capture desktop and mobile screenshots):

```sh
LIVE_SMOKE=1 npx playwright test tests/live-smoke.spec.ts
```

Useful manual checks:

1. Combine a name, category, and price range; change the sort and confirm all conditions remain active.
2. Enter a name with no matches, then clear the filters.
3. Set the minimum above the maximum and check the validation message.
4. Open a filtered URL in another tab and confirm the view is restored.
5. On a phone-sized viewport, open the filters, change a value, close the dialog, and continue browsing.
6. Block the products request, check the error state, then restore the connection and retry.

## Deployment

The repository includes `.github/workflows/deploy.yml`. A push to `main`, or a manual workflow run, installs the locked dependencies, runs the unit, browser, and accessibility tests, builds the application, and deploys `dist/` to GitHub Pages. Build and deploy jobs have separate permissions; only deployment can write Pages and request an identity token. Concurrent deployments are serialized.

For a fork, enable **Settings → Pages → Source → GitHub Actions**, then run the workflow. Vite uses a relative asset base, so the build works beneath a GitHub Pages repository path. The output is also a static `dist/` folder that can be hosted on Vercel or Netlify with `npm run build` as the build command.

No secrets belong in this client application. Any future private API integration would need a server-side boundary.
