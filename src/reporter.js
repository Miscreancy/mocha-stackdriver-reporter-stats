"use strict";

const Mocha = require("mocha");
const CloudLogger = require("./google-cloud-logger");

const {
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_RUN_BEGIN,
  EVENT_TEST_END
} = Mocha.Runner.constants;

function StackdriverReporter(runner, options = {}) {
  const { reporterOptions } = options;
  const { projectId, logName } = ensureOptions(reporterOptions);

  Mocha.reporters.Base.call(this, runner, options);

  const entryMetadata = getEntryMetadata(reporterOptions);
  const log = new CloudLogger(projectId, logName, entryMetadata);

  const result = {
    passes: [],
    failures: [],
    tests: 0
  };

  runner
    .once(EVENT_RUN_BEGIN, () => {
      result.start = new Date()
    })
    .on(EVENT_TEST_PASS, (test) => {
      result.passes.push(test.fullTitle());
    })
    .on(EVENT_TEST_FAIL, (test, err) => {
      result.failures.push({
        test: test.fullTitle(),
        message: err.message,
      });
    })
    .on(EVENT_TEST_END, () => {
      result.tests++
    })
    .once(EVENT_RUN_END, () => {
      result.end = new Date()
      result.duration = result.end - result.start
      if (reporterOptions.alsoConsole || reporterOptions.onlyConsole)
        console.log("result", JSON.stringify(result));

      if (!reporterOptions.onlyConsole) {
        if (result.failures.length > 0) log.error(result);
        else log.info(result);
      }
    });
}

Mocha.utils.inherits(StackdriverReporter, Mocha.reporters.Base);

module.exports = StackdriverReporter;

function ensureOptions(reporterOptions) {
  if (
    !reporterOptions ||
    !reporterOptions.projectId ||
    !reporterOptions.logName
  ) {
    const errorMessage = `
Required reporter options not set.
Please, supply Google Cloud Platform project ID and log name.
Example: --reporter-options projectId=myGcpProjectId,logName=myLog
`;
    console.error("Error:", errorMessage);

    throw new Error(errorMessage);
  }

  const { projectId, logName } = reporterOptions;

  return {
    projectId,
    logName,
  };
}

function getEntryMetadata(reporterOptions) {
  const entryMetadata =
    reporterOptions.entryMetadata || process.env.ENTRY_METADATA;

  if (!entryMetadata) return undefined;

  if (typeof entryMetadata === "string") {
    return JSON.parse(entryMetadata);
  } else if (typeof entryMetadata === "object") {
    return entryMetadata;
  } else {
    const errorMessage = `
Reporter option 'entryMetadata' cannot be parsed to JSON.
Current configuration:
entryMetadata => ${entryMetadata}
Please, specify metadata for entry as JSON or object literal.
`;

    console.error("Error:", errorMessage);
    throw new Error(errorMessage);
  }
}
