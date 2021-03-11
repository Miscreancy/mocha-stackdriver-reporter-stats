# Mocha Stackdriver Reporter w/ Stats

Mocha reporter using the Google Cloud Logging API with additional stats.

Originally a fork of (mocha-stackdriver-reporter)[https://github.com/jouni-kantola/mocha-stackdriver-reporter] and full credit to the original author, whose work I have and will continue to build on.

## Install

`npm install mocha-stackdriver-reporter-stats --save-dev`

## Options

- `projectId`: Google Cloud Project ID.
- `logName`: Log identifier; gets merged with `projectId` into e.g. `projects/test123/logs/my-function%2Fwith-name`. Note how last part is URL encoded. This is automatically taken care when using a `logName` with `/` in the name, e.g. `my-function/with-name`.
- `entryMetadata`: Metadata for log entries.

## CLI

Run mocha with reporter configured:

```bash
mocha --reporter mocha-stackdriver-reporter-stats --reporter-options projectId=myGcpProjectId,logName=myLogName
```

Entry metadata can be set with environment variable `ENTRY_METADATA`:

```bash
ENTRY_METADATA='{ "resource": { "labels": { "function_name": "my-cloud-function", "project_id": "my-project-id", "region": "my-region" }, "type": "cloud_function" } }' \
mocha --reporter mocha-stackdriver-reporter-stats --reporter-options projectId=my-project-id,logName=my-log-name
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
