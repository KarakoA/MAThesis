# Automatic Interaction Diagram Generation of Vue.js-based Web Applications
This repository holds the source code for my master's thesis on the topic "Automatic Interaction Diagram Generation of Vue.js-based Web Applications"
## Deployment

1. Install dependencies
```bash
npm install
```
2. Generate interaction diagram graph
```bash
npm run generate -- [file to parse] [output graph path] [scenario depth]
```

3. Start server in order to view interaction diagram
```bash
npm run serve
```
4. Observe interaction diagram in browser
```bash
firefox localhost:8000
```

## Generating a results snapshot
See this [README](/results) for more details.

## Commands overview
Lint the project
```bash 
npm run lint
```
Run TypeScript type checker
```bash
npm run type-check
```
Execute unit tests
```bash
npm run test
```
Execute regression tests
```bash
npm run test:regression
```
Execute the main application
```bash
npm run generate
```
Start a server to view interaction diagram in browser
```bash
npm run serve
```
Create a snapshot for each file in `resources/test-files`
```bash
npm run create-results
```
Start a server to view all snapshots in the browser
```bash
npm run results
```
