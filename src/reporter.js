"use strict";

const Mocha = require("mocha");
const CloudLogger = require("./google-cloud-logger");

const {
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_PENDING,
  EVENT_RUN_BEGIN,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_TEST_END
} = Mocha.Runner.constants;

function StackdriverReporter(runner, options = {}) {
  const { reporterOptions } = options;
  const { projectId, logName } = ensureOptions(reporterOptions);

  Mocha.reporters.Base.call(this, runner, options);

  const entryMetadata = getEntryMetadata(reporterOptions);
  const log = new CloudLogger(projectId, logName, entryMetadata);

  const obj = {
    passes: [],
    failures: [],
    totalTestsRegistered: 0
  };

  if (!runner.stats) {
    const createStatsCollector = require('/mocha/lib/stats-collector')
    createStatsCollector(runner)
  }

  runner
    .on(EVENT_TEST_PASS, (test) => {
      obj.passes.push(test.fullTitle());
    })
    .on(EVENT_TEST_FAIL, (test, err) => {
      obj.failures.push({
        test: test.fullTitle(),
        message: err.message,
      });
    })
    .on(EVENT_TEST_END, () => {
      result.totalTestsRegistered++
    })
    .once(EVENT_RUN_END, () => {
      obj.stats = configureStats(this.stats)
      if (reporterOptions.alsoConsole || reporterOptions.onlyConsole)
        console.log("result", JSON.stringify(obj));

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

function configureStats(statsObject, reporterOptions) {
  if (!reporterOptions.stats) {
    return statsObject
  }
  else {
    const newStatsObject = {}
    reporterOptions.stats.forEach(function (item) {
      newStatsObject.item = statsObject.item
    })
    return newStatsObject
  }
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
