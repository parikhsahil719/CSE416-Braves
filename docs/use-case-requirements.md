# Use Case Requirements

Source: CSE 416 Preliminary Master Use Case List (3/12/26), S01 Spring 2026.

This document contains the full requirements for every use case the team is implementing. It is the single source of truth for what each use case must do, referenced by the `/code-review` skill and all project documentation.

## Notation

Three priority categories:
- **Required** — must be implemented for the final project
- **Preferred** — should be implemented if possible
- **Optional** — extra credit / stretch goal

Diagram tags: **(SD)** = sequence diagram, **(AD)** = activity diagram. These indicate the use case may be requested during design review.

## Ensemble Sizes

- Testing ensembles: ~250 plans
- Final project ensembles: ~5,000 plans

---

## General GUI (19 selected)

### GUI-1: Select state to display (required) (SD)

The user can pick a state through a dropdown menu or possibly through clicking on the state in a map of the US. The state selection will also cause the map of the state to be displayed as described in GUI-2.

- **Backend:** `GET /api/states`
- **Frontend:** SplashPage state selector + US map click
- **States:** OR, SC

### GUI-2: Display the current district plan when state is selected (required) (SD)

After selecting a state either from the map or the dropdown, by default, the user should be shown the current Congressional district plan displayed on the centered state map at a zoom level appropriate to the size and location of the state.

- **Backend:** `GET /api/states/{stateId}/districts/enacted/topology`
- **Frontend:** DistrictMap component with Leaflet rendering
- **Data:** TopoJSON topology with `properties.RESULT` for party color styling

### GUI-3: State data summary (required) (SD)

The data associated with the state will be summarized in response to the user selecting the state and shown concurrently with the map of the state (GUI-2). At a minimum, the summary data will include:
- State population (either total or voting age population)
- State voter distribution (estimate of Republican and Democratic voting percentage based on 2024 Presidential voting)
- Population of each significant racial/ethnic group in the state
- Party control of the redistricting process (if any)
- Summary of Congressional representatives by party
- Summary of the ensembles available for the state (number of district plans in the ensemble and the population equality threshold used in the MCMC computation)

Population percentage may substitute for raw population.

- **Backend:** `GET /api/states/{stateId}/summary`
- **Frontend:** StatePage sidebar

### GUI-4: Display demographic heat map by precinct (required) (SD)

When the user selects a feasible minority group from a drop-down menu, a heat map for the demographic group in the state will be displayed. The monochromatic heat map will show the percentage range of the selected group in each precinct. Choose a number of bins that effectively shows the population distribution with bin ranges that are equal. Use bounds that are integer values of population percentage. The map will include a legend that displays the bin ranges and associated colors. To improve readability, you can eliminate any bins that contain no values thereby improving the color separation.

- **Backend (geometry):** `GET /api/states/{stateId}/precincts/topology`
- **Backend (bins):** `GET /api/states/{stateId}/heatmap/precincts?group=...`
- **Frontend:** MinorityHeatMap component
- **Controls:** Demographic group dropdown (feasible groups only)

### GUI-6: Display Congressional representation table (required) (SD)

When the user clicks on screen component selecting district detail (or some other appropriate trigger), a table will be displayed. Each row in the table will contain data for one Congressional district. At a minimum, the data will contain:
- District number
- Representative (for the enacted plan only)
- Representative's party
- Representative's racial/ethnic group
- Vote margin as a percentage in the selected recent election

- **Backend:** `GET /api/states/{stateId}/districts/enacted/table?election=...`
- **Frontend:** District table component

### GUI-7: Highlight district (preferred)

If a user clicks on some identifier of a district in the Congressional detail table (GUI-6), the district will be highlighted on the map. Highlighting can be performed in a variety of ways. For example, the border of the highlighted district might change color or thickness.

- **Backend:** Client-only (uses GUI-2 + GUI-6 data already in browser state)
- **Frontend:** Click handler linking table row to map highlight

### GUI-8: Compare two district plans on the map (preferred) (SD)

Compare two district plans by showing both plans on the map. This could be limited to comparing a selected random plan (i.e., interesting) with the enacted plan. The trigger will be some GUI component (e.g., "Compare with enacted" button).

- **Backend:** Client-only (uses GUI-2 enacted plan + GUI-19 interesting plan data)
- **Frontend:** Map overlay component with toggle/comparison UI

### GUI-9: Display Gingles analysis results (required) (SD)

In response to a user request, display a scatter plot for each of your states that shows the 2024 precinct-level Presidential election results for each party organized on an x,y axis by percentage of racial/ethnic group in the precinct (x-axis) and party vote share (y-axis). Any of the feasible racial/ethnic groups in the state should be selectable for display. For each precinct, there will be a blue dot for Democratic votes and a red dot for Republican votes.

- **Backend:** `GET /api/states/{stateId}/analysis/gingles?group=...&election=...`
- **Frontend:** Gingles scatter component (Recharts)
- **Controls:** Demographic group selector
- **Visual:** Blue dots (Dem), red dots (Rep), regression curves

### GUI-10: Display the Gingles 2/3 analysis data in a tabular display (preferred)

For all of the Gingles 2/3 analysis data, a table display of the precinct-by-precinct results will be displayed. Each row will display the data for a precinct including total population, minority non-white population, Republican votes, and Democratic votes.

- **Backend:** `GET /api/states/{stateId}/analysis/gingles/table?group=...&election=...`
- **Frontend:** Precinct table component
- **Fields per row:** precinctId, precinctName, totalPopulation, minorityPopulation, republicanVotes, democraticVotes, minorityShare, repVoteShare, demVoteShare

### GUI-12: Display candidate results of Ecological Inference (EI) analysis (required) (SD)

Display the results of the EI analysis in response to a user GUI request. The user shall have the ability to select the racial/language groups to compare. The results will be shown in a display for each candidate in which the x-axis represents the percentage of a racial/demographic group in the state that voted for a candidate and the y-axis represents the associated probability value for each x-axis value. You will use this to measure racially polarized voting, so you can use the statewide results for President in 2024.

- **Backend:** `GET /api/states/{stateId}/analysis/ei-support?groups=...&election=...&party=...`
- **Frontend:** EI.jsx or sub-component (Recharts density curves)
- **Controls:** Group selector, candidate/party selector

### GUI-13: Display EI precinct results in a bar chart (preferred)

Display the EI results in a bar chart for the categories mentioned in a previous use case. The height of each bar will correspond to the peak value in the chart for each category. Each bar will also display a confidence interval showing the range of values determined in the EI analysis.

- **Backend:** `GET /api/states/{stateId}/analysis/ei-precinct-bar-ci?group=...&election=...&party=...`
- **Frontend:** EI bar chart component
- **Visual:** Bars at peak values with CI whiskers (ciLow to ciHigh)

### GUI-15: Display EI KDE results (preferred)

Display the EI KDE results that compare support for a candidate between two racial/ethnic groups (e.g., white and African American).

- **Backend:** `GET /api/states/{stateId}/analysis/ei-kde?group=...&election=...&metric=...`
- **Frontend:** KDE chart component (Recharts area/line)
- **Visual:** Overlaid density curves with optional threshold annotation

### GUI-16: Display ensemble splits in a bar chart (required) (SD)

Display the race-blind and VRA constrained ensemble results to allow the user to make a comparison. Each display will take the form of a bar chart of Republican/Democratic splits where each bar will show the frequency of a distinct simulated election as #Republican wins / #Democratic wins. The range of splits shown should be the range of the union of the two sets of splits (i.e., the range should be the same for both displays, but the tails omitted if they are zero in both sets).

- **Backend:** `GET /api/states/{stateId}/ensembles/splits?ensembleSize=...&election=...`
- **Frontend:** Ensemble splits component (Recharts bar chart)
- **Invariant:** `repWins + demWins = totalDistricts`; frequencies sum to `ensembleSize`

### GUI-17: Display box & whisker data (required) (SD)

The user will be able to request the display of box & whisker data for each of your ensembles of district plans. The displays will be available for each of the feasible racial/ethnic groups in the state. Dots for each district in the current enacted district plan will be shown in the display (in order of increasing percentage of the minority group or associated display). If there is a proposed district plan awaiting approval, that will also be shown. The display should be sufficient in size to show your largest state and should include a legend and color selection to make the chart easily readable.

- **Backend:** `GET /api/states/{stateId}/ensembles/box-whisker?group=...&ensembleType=...&metric=...`
- **Frontend:** Box whisker component (Recharts)
- **Controls:** Group selector, ensemble type selector
- **Invariant:** `rankSummaries.count = totalDistricts`; values ordered `min <= q1 <= median <= q3 <= max`; all in `[0,1]`

### GUI-19: Display an "interesting" district plan (preferred)

Display on the map one of the interesting plans identified in a SeaWulf use case.

- **Backend:** `GET /api/states/{stateId}/districts/interesting?planId=...`
- **Frontend:** Interesting plan map component
- **Data:** Plan metadata + TopoJSON topology (Mongo-backed)

### GUI-20: Display VRA impact threshold table (required)

Display a summary table comparing the race-blind and VRA-constrained ensembles across three legal threshold metrics:
1. The proportion of plans meeting or exceeding the enacted plan's number of effective minority districts for each feasible race
2. The proportion achieving rough proportionality relative to each feasible minority CVAP share
3. The proportion satisfying both conditions jointly

Each row displays the percentage for each ensemble side-by-side. The table is filtered by feasible race. Side-by-side percentages allow the user to assess how rarely minority representation meets legal calibers by chance in the absence of VRA constraints.

- **Backend:** `GET /api/states/{stateId}/analysis/vra-impact-thresholds?group=...&election=...`
- **Frontend:** VRA impact table component
- **Invariant:** Always exactly 3 metric rows

### GUI-21: Display minority effectiveness box & whisker data (required)

Display box & whisker data comparing minority effectiveness across the Race-Blind and VRA-Constrained ensembles. For each feasible racial/ethnic group (x-axis), two side-by-side boxes will be shown representing each ensemble, with the y-axis indicating the number of effective districts (0 to N). Discrepancies between RB and VRA ensemble boxes visually allows the user to assess how rarely minority representation arises by chance in the absence of VRA constraints.

- **Backend:** `GET /api/states/{stateId}/analysis/minority-effectiveness/box-whisker?election=...`
- **Frontend:** Effectiveness box whisker component
- **Invariant:** Summary values are integer district counts; `min <= q1 <= median <= q3 <= max`

### GUI-22: Display minority effectiveness ensemble histogram (required)

Display overlapping histograms comparing the distribution of minority-effective districts across both the race-blind and VRA-constrained ensembles. The x-axis will represent the number of minority-effective districts (per plan, e.g. 0 to # districts in state) and the y-axis will represent the number of plans in the ensemble at each value. Degree of overlap allows the user to directly compare the shape and spread of both distributions.

- **Backend:** `GET /api/states/{stateId}/analysis/minority-effectiveness/histogram?group=...&election=...`
- **Frontend:** Effectiveness histogram component
- **Invariant:** Frequencies sum to `ensembleSize`

### GUI-24: Reset page (preferred)

When the user clicks a reset button, the GUI will reset to the condition before the user selected a state.

- **Backend:** Client-only (clears frontend state)
- **Frontend:** Reset button handler

---

## Not Implementing (GUI)

The following GUI use cases are explicitly excluded from scope:
- **GUI-5** — Display demographic heat map by census block (preferred)
- **GUI-11** — Highlight a Gingles 2/3 table row (preferred)
- **GUI-14** — Display EI precinct results in choropleth maps (preferred)
- **GUI-18** — Display vote share vs seat share curve (preferred)
- **GUI-23** — Display VRA impact threshold table (duplicate of GUI-20)

---

## Preprocessing (10 selected)

### Prepro-1: Integrate multiple data sources (required) (AD)

Integrate and merge US Census data (population, both for total and for any opportunity groups), precinct data (boundary, name, demographics, etc.), and existing district data (boundary, name, district#, etc.). Geographic boundary data should be converted (if necessary) to a consistent format (e.g., GeoJSON).

### Prepro-2: Identify precinct neighbors (required) (AD)

Identify two precincts as neighbors if they share a common boundary of at least 200 feet and the edges of each precinct are within 200 feet of its neighbors' edges. If possible, try to locate a data source for which this computation is already done.

### Prepro-3: Integrate enacted plan with dataset (required)

Integrate the enacted plan for the state within the server database.

### Prepro-4: Store preprocessed data (required)

The preprocessed data should be stored in the NoSQL or relational database. If a relational database is used, the data should be stored in third normal form. Data might also be stored in a file system accessible to the server.

### Prepro-5: Store SeaWulf data (required)

Retrieve generated data from SeaWulf for each of your states, convert to an appropriate format, and store either in your database or in a file system. Data stored in a file system should be accessible through a path obtained from your database.

### Prepro-6: Generate data files required for SeaWulf processing (required) (AD)

Generate all the data files required for SeaWulf processing. This will include the graph representation of the precincts in a state as well as geographic, election, and incumbent data for each precinct.

### Prepro-7: Gingles 2/3 precinct analysis (required) (AD)

Perform a precinct-by-precinct analysis of voting results and minority population percentage for some 2024 statewide race (Presidential, most likely). For each precinct, the analysis will identify the winning party, the Republican vote share, the Democratic vote share, and the population percentage of each significant racial/ethnic group. The analysis is repeated for each feasible racial/ethnic group in the state.

### Prepro-8: Gingles 2/3 non-linear regression analysis (required) (AD)

For the statewide race used in the use case above, calculate the non-linear regression curve for the Republican and Democratic precinct values for each Gingles 2/3 graph. Multiple equation forms will be used to determine the best form for non-linear regression.

### Prepro-9: Use the PyEI MGGG software to calculate Ecological Inference data (required)

Use the PyEI MGGG software to calculate results for the statewide race (e.g., 2024 presidential) for each of the feasible racial/ethnic groups identified in each state.

### Prepro-11: Calculate Box & Whisker Data for Enacted Plan (required)

Calculate the box & whisker data for the enacted district plan for any of the box & whisker displays attempted.

### Not Implementing (Preprocessing)

- **Prepro-10** — Calculate the vote share vs seat share curve data (preferred)

---

## SeaWulf (12 selected)

### SeaWulf-1: Server dispatcher (required)

Establish a protected directory on SeaWulf to store your team's data. Pre-stage any data that might be used repeatedly for SeaWulf runs. Prior to submitting a batch districting run request, the data required for the run should be marshalled (from memory and/or DB) and passed to the SeaWulf as a file (or multiple files) to be stored in the team's SeaWulf file system.

### SeaWulf-2: Run MGGG ReCom algorithm on the SeaWulf (required) (AD)

Set the constants in the MGGG code to define the properties (e.g., constraints) of the run. Any run-control information should be packaged in a SeaWulf acceptable format (e.g., script commands) and executed on SeaWulf. Your activity diagram should demonstrate that you understand how the MGGG algorithm operates. You should generate a test ensemble and a large ensemble. The test ensemble will contain approximately 250 random district plans and the large ensemble will contain approximately 5,000 plans.

### SeaWulf-3: Run MGGG VRA Constrained ReCom algorithm on the SeaWulf (required) (AD)

Set the constants in the MGGG code to define the properties (e.g., constraints) of the run. Any run-control information should be packaged in a SeaWulf acceptable format (e.g., script commands) and executed on SeaWulf. Your activity diagram should demonstrate that you understand how the MGGG algorithm operates. You should generate a test ensemble and a large ensemble. The test ensemble will contain approximately 250 random district plans and the large ensemble will contain approximately 5,000 plans.

### SeaWulf-4: Coordinate/aggregate SeaWulf core generated data (required) (AD)

You will run your code on a single SeaWulf node, one that has multiple cores. Each of the cores will generate one or more random graph partitions (i.e., district plans) and store a concise version of those results in a shared file directory for your team. Following the completion of each random graph partition, the core begins the generation of the next random district plan. You will coordinate the work of the multiple cores so that when the target number of district plans is completed, each of the cores ends its processing.

### SeaWulf-5: Calculate election winners (required) (AD)

Using 2024 statewide presidential results, estimate the election results in each district of each ensemble district plan. You will calculate this by summing up the estimated votes in each node (i.e., precinct) of a partition sub-graph. You can use a suitable precinct by precinct vote in the 2024 presidential election.

### SeaWulf-6: Calculate minority effectiveness score per random district (required)

For each random district in a random district plan, calculate the minority effectiveness for each minority that is feasible in the state. Also, determine if that effectiveness score exceeds the effectiveness threshold.

### SeaWulf-7: Calculate minority population percentage per random district (required)

For each random district in a random district plan, calculate the minority population percentage for each minority that is feasible in the state. Also, determine if that population percentage exceeds the minority population percentage threshold.

### SeaWulf-8: Calculate the Republican/Democratic split for each random district plan (required) (AD)

For each generated plan in an ensemble, estimate the Republican/Democratic votes in each district. Since each district is a collection of precincts, use the historic precinct vote totals (e.g., 2024 Presidential) to estimate the winner of an election in each district.

### SeaWulf-9: Identify and store additional random district plans of note (preferred) (AD)

You will not be able to store all your random district plans in the server database, but you will store some subset of those plans. Summary information and detailed information of such plans should be stored in your server database for eventual display by the user. Teams should decide what is "interesting", but at a minimum, these should include maximum and minimum effectiveness plans. About 5-10 plans would be sufficient. The "interesting" plans would be available for display in the GUI.

### SeaWulf-10: Calculate ensemble measures (required) (AD)

Calculate the summary measures for each ensemble. At a minimum, measures will include the number of district plans, and for each plan, Republican/Democratic splits, number of minority effective districts, and the number of opportunity districts (i.e., majority-minority districts).

### SeaWulf-11: Calculate box & whisker data (required) (AD)

Calculate the box & whisker summary data for all the random district plans generated by the SeaWulf. These calculations will be made for each feasible racial/ethnic group in the state.

### SeaWulf-13: Python profiler (preferred)

Profile your system performance on SeaWulf using a Python profiler tool. Identify the procedures that consume the most CPU time. Results can be displayed using some Python-appropriate tool and displayed as an image in your final presentation.

### Not Implementing (SeaWulf)

- **SeaWulf-12** — Run on multiple SeaWulf nodes (preferred). Multi-node MPI coordination is out of scope; single-node multi-core is sufficient.
