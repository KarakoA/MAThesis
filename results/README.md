## Results

Contains results obtained by `npm run create-results` alongside the interaction diagrams as a png.

Alternatively can be viewed via `npm run results` and navigating to `localhost:8001`

### Structure
 
 `<date>/<script>/<files>` where 

1) `date` is the date (`day-month-year`) that the files were generated on

2) `<script>` is a name for one of the test `Vue.js` SPAs

3) and `<files>` consists of the following:
 
* `data.json` - raw output of the interaction diagram graph data
* `scenarios.txt` - generated scenarios, including l(A) and S_0 ... S_n (currently just as text)
* `index.html` - displays the interaction diagram
* `diagram.png`- the diagram as a png
* `<script>.vue` - the code for which all of the above was generated
