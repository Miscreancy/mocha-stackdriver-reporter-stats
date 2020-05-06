# Mocha Stackdriver Reporter

Mocha reporter using the Google Cloud Logging API.

![npm cit](https://github.com/jouni-kantola/mocha-stackdriver-reporter/workflows/npm%20cit/badge.svg)

## Install

`npm install mocha-stackdriver-reporter --save-dev`

## CLI

Run mocha with reporter configured:

```bash
mocha --reporter mocha-stackdriver-reporter --reporter-options projectId=myGcpProjectId,logName=myLogName
```

Entry metadata can be set with environment variable `ENTRY_METADATA`:

```bash
ENTRY_METADATA='{ "resource": { "labels": { "function_name": "my-cloud-function", "project_id": "my-project-id", "region": "my-region" }, "type": "cloud_function" } }' \
mocha --reporter mocha-stackdriver-reporter --reporter-options projectId=my-project-id,logName=my-log-name
```

## Code

```javascript
const Mocha = require("mocha");
const StackdriverReporter = require("mocha-stackdriver-reporter");

const mocha = new Mocha();

mocha.reporter(StackdriverReporter, {
  projectId: "my-project-id",
  logName: "my-log-name",
  entryMetadata: {
    resource: {
      labels: {
        function_name: "my-cloud-function",
        project_id: "my-project-id",
        region: "my-region",
      },
      type: "cloud_function",
    },
  },
  alsoConsole: false, // (optional) if true, also output result to console
  onlyConsole: false, // (optional) if true, only output result to console
});
```
