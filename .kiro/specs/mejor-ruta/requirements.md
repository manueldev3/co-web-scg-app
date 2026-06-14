# Requirements Document

## Introduction

This feature adds a "Mejor Ruta" (Best Route) subsection to the existing "Data" menu section of the SCG web application. The subsection provides a trade-route finder that consumes UEX Corp commodity, price, terminal, and vehicle data and returns the most profitable buy-low / sell-high trade routes for a selected ship, given an initial investment in UEC. The tool mirrors the SC Trade Tools "Trade Routes" finder: it exposes a ship selector, an initial-investment input, and a set of sidebar filters (profit mode, maximum number of stops, commodity/type/faction inclusion or exclusion, security level, box size, and location toggles), then displays ranked route results in the main area.

Additionally, this feature introduces a global footer, shown on every page of the application, that contains a disclaimer stating the application is an unofficial Star Citizen tool not affiliated with Cloud Imperium Games, along with links and contact information.

The application is built with a modified version of Next.js (App Router), TypeScript, Ant Design, and Tailwind CSS. The existing UEX Corp API client at `app/mercancia/uex-api.ts` and `app/terminales/uex-api.ts` (base URL `https://api.uexcorp.uk/2.0`, no authentication) is the data source.

## Glossary

- **Route_Finder**: The "Mejor Ruta" page and its client UI, accessible at the `/mejor-ruta` route, that collects inputs and filters and displays route results.
- **Route_Engine**: The computation component that derives ranked trade routes from commodity price, terminal, and ship data according to the active inputs and filters.
- **Trade_Route**: A computed result consisting of a buy terminal, a sell terminal, one or more commodities, the quantity purchased in SCU, the capital required in UEC, and the resulting profit in UEC.
- **UEX_Client**: The data-access component that retrieves commodities, commodity prices, terminals, and vehicles from the UEX Corp API.
- **Ship**: A vehicle entry retrieved from UEX that has a cargo capacity expressed in SCU and is selectable as the transport for a Trade_Route.
- **Initial_Investment**: The amount of capital, in UEC, the user has available to purchase commodities.
- **SCU**: Standard Cargo Unit, the volume unit used for commodity quantity and ship cargo capacity.
- **UEC**: United Earth Credits, the in-game currency used for prices, investment, and profit.
- **Profit_Mode**: The selected ranking criterion for routes, either "Profit over time" or "Pure profit".
- **Site_Navigation**: The application header navigation component (`app/components/SiteHeader.tsx`) containing the "Data" menu section.
- **Data_Menu**: The "Data" submenu (menu key "2") within Site_Navigation, which currently contains only the "Mercancía" item.
- **Global_Footer**: The footer component rendered on every page through the root layout, containing disclaimer, links, and contact sections.
- **Hidden_Location**: A terminal or location flagged by UEX data as hidden or not publicly listed.

## Requirements

### Requirement 1: Mejor Ruta navigation entry

**User Story:** As a player, I want to reach the Best Route tool from the Data menu, so that I can find profitable trade routes alongside the existing Mercancía data.

#### Acceptance Criteria

1. THE Data_Menu SHALL display a "Mejor Ruta" item in addition to the existing "Mercancía" item.
2. WHEN a user selects the "Mejor Ruta" item, THE Site_Navigation SHALL navigate to the `/mejor-ruta` route.
3. WHILE the active route is `/mejor-ruta`, THE Site_Navigation SHALL render the Data_Menu and the "Mejor Ruta" item in their selected state.
4. THE Site_Navigation SHALL keep the "Mejor Ruta" item within the Data_Menu and SHALL NOT place the item under the "Herramientas" menu.

### Requirement 2: Ship and investment inputs

**User Story:** As a player, I want to specify my ship and starting capital, so that the route results match what I can actually carry and afford.

#### Acceptance Criteria

1. THE Route_Finder SHALL display a Ship selector populated with ships retrieved from the UEX_Client.
2. THE Route_Finder SHALL display an Initial_Investment input that accepts a UEC amount.
3. THE Route_Finder SHALL display a Submit control and a Reset control.
4. WHEN a user activates the Reset control, THE Route_Finder SHALL restore the Ship selector, the Initial_Investment input, and all filters to their default values.
5. IF a user activates the Submit control while the Ship selector has no selected ship, THEN THE Route_Finder SHALL display a validation message identifying the missing ship selection and SHALL NOT request a route computation.
6. IF a user activates the Submit control while the Initial_Investment input is empty, zero, or negative, THEN THE Route_Finder SHALL display a validation message identifying the invalid investment and SHALL NOT request a route computation.

### Requirement 3: Route computation

**User Story:** As a player, I want the tool to compute the most profitable routes, so that I can maximize my earnings per trip.

#### Acceptance Criteria

1. WHEN a valid route computation is requested, THE Route_Engine SHALL produce a list of Trade_Routes where each route buys a commodity at a terminal and sells the same commodity at a different terminal.
2. THE Route_Engine SHALL compute each Trade_Route profit as the sell value minus the buy value for the purchased quantity, expressed in UEC.
3. THE Route_Engine SHALL constrain each Trade_Route purchased quantity so that the quantity in SCU does not exceed the selected Ship cargo capacity in SCU.
4. THE Route_Engine SHALL constrain each Trade_Route buy value so that the buy value in UEC does not exceed the Initial_Investment.
5. WHILE Profit_Mode is "Pure profit", THE Route_Engine SHALL rank Trade_Routes in descending order of total profit in UEC.
6. WHILE Profit_Mode is "Profit over time", THE Route_Engine SHALL rank Trade_Routes in descending order of profit per unit of travel or wait time.
7. THE Route_Engine SHALL constrain each Trade_Route purchased quantity so that the quantity does not exceed the available supply at the buy terminal and does not exceed the available demand at the sell terminal as reported by UEX price data.

### Requirement 4: Miscellaneous filters

**User Story:** As a player, I want to adjust route constraints and presentation, so that the results fit my play style.

#### Acceptance Criteria

1. THE Route_Finder SHALL display a Profit_Mode control offering "Profit over time" and "Pure profit" as mutually exclusive choices.
2. THE Route_Finder SHALL display a maximum-number-of-stops control that accepts an integer value.
3. WHEN a maximum number of stops is set, THE Route_Engine SHALL exclude Trade_Routes whose number of stops exceeds the maximum number of stops.
4. THE Route_Finder SHALL display an "Allow wait timers" toggle, an "Auto-loading" toggle, a "Smart filters" toggle, and an "Expanded view" toggle.
5. WHILE the "Expanded view" toggle is enabled, THE Route_Finder SHALL display the extended set of details for each Trade_Route.
6. WHILE the "Allow wait timers" toggle is disabled, THE Route_Engine SHALL exclude Trade_Routes that require a wait timer at a terminal.

### Requirement 5: Commodity, type, and faction filters

**User Story:** As a player, I want to include or exclude specific commodities, types, and factions, so that I can avoid cargo I do not want to trade.

#### Acceptance Criteria

1. THE Route_Finder SHALL display a commodity-types multiselect, a commodities multiselect, and a factions multiselect, each populated from UEX data.
2. THE Route_Finder SHALL display, for each multiselect, a mutually exclusive choice between "Avoid selection" and "Only selection".
3. WHILE a multiselect is set to "Only selection" with one or more values selected, THE Route_Engine SHALL include only Trade_Routes whose corresponding attribute matches at least one of the selected values for that multiselect.
4. WHILE a multiselect is set to "Avoid selection" with one or more values selected, THE Route_Engine SHALL exclude Trade_Routes whose corresponding attribute matches any of the selected values.
5. WHERE a multiselect has no selected values, THE Route_Engine SHALL apply no filtering for that multiselect.

### Requirement 6: Security, box size, and location filters

**User Story:** As a player, I want to filter routes by security, container size, and location visibility, so that the results match my safety and logistics preferences.

#### Acceptance Criteria

1. THE Route_Finder SHALL display a minimum-security-level control.
2. WHEN a minimum security level is set, THE Route_Engine SHALL exclude Trade_Routes that include a terminal whose security level is below the minimum security level.
3. THE Route_Finder SHALL display a supported-box-size control measured in SCU.
4. WHEN a supported box size is set, THE Route_Engine SHALL include only Trade_Routes whose commodities are tradable in the supported box size.
5. THE Route_Finder SHALL display an "Avoid hidden locations" toggle.
6. WHILE the "Avoid hidden locations" toggle is enabled, THE Route_Engine SHALL exclude Trade_Routes that include a Hidden_Location.

### Requirement 7: Results presentation

**User Story:** As a player, I want to see the route results clearly, so that I can act on the best option.

#### Acceptance Criteria

1. WHEN the Route_Engine returns one or more Trade_Routes, THE Route_Finder SHALL display each Trade_Route with its buy terminal, sell terminal, commodity, purchased quantity in SCU, capital required in UEC, and profit in UEC.
2. WHEN the Route_Engine returns zero Trade_Routes for the active inputs and filters, THE Route_Finder SHALL display a no-results message.
3. WHILE a route computation is in progress, THE Route_Finder SHALL display a loading indicator until either Trade_Route results or the no-results message is displayed.

### Requirement 8: UEX data retrieval

**User Story:** As a player, I want the tool to use current market data, so that the routes reflect the live economy.

#### Acceptance Criteria

1. THE UEX_Client SHALL retrieve commodities, commodity prices, terminals, and ships from the UEX Corp API at base URL `https://api.uexcorp.uk/2.0`.
2. IF a UEX Corp API request fails or returns a non-success status, THEN THE UEX_Client SHALL return an empty result for that request and THE Route_Finder SHALL display an error message indicating that market data could not be loaded.
3. THE UEX_Client SHALL send requests to the commodities, commodity-prices, terminals, and ships endpoints without an authentication token.

### Requirement 9: Global footer

**User Story:** As a visitor, I want a disclaimer on every page, so that I understand the application's unofficial status and how to reach the maintainers.

#### Acceptance Criteria

1. THE Global_Footer SHALL be rendered on every page of the application.
2. THE Global_Footer SHALL display a disclaimer stating that the application is an unofficial Star Citizen tool that is not affiliated with Cloud Imperium Games.
3. THE Global_Footer SHALL display a links section and a contact section.

### Requirement 10: Framework compliance constraint

**User Story:** As a maintainer, I want the implementation to follow this project's modified Next.js conventions, so that the feature does not break under the project's framework changes.

#### Acceptance Criteria

1. WHERE the implementation adds or modifies Next.js routes, layouts, components, or data fetching, THE implementation SHALL conform to the guidance in `node_modules/next/dist/docs/`.
