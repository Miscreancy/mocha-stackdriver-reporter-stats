"use strict";

const Mocha = require("mocha");
const CloudLogger = require("./google-cloud-logger");
const fs = require("fs");
const nanoid =  require("nanoid")

const {
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_PENDING,
  EVENT_RUN_BEGIN,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_TEST_END,
  EVENT_RUN_END
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
    .on(EVENT_SUITE_BEGIN, function (suite) {
      if (suite.title) {
        obj.suite = suite.title
      }
    })
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
      obj.totalTestsRegistered++
    })
    .once(EVENT_RUN_END, () => {
      obj.stats = configureStats(this.stats, reporterOptions)
      if (reporterOptions.alsoConsole || reporterOptions.onlyConsole ) {
        console.log("[mochastackdriver] result:", JSON.stringify(obj));
      }

      if (!reporterOptions.onlyConsole && (reporterOptions.onlyFile || reporterOptions.alsoFile)) {
        const fileObj = {}
        fileObj.data = obj
        if (entryMetadata) { fileObj.metadata = entryMetadata }
        fileObj.projectId = projectId
        fileObj.logName = logName
        let suiteName = fileObj.data.suite.toString().replace(/\s/g, '')
        const filePath = `${reporterOptions.reportDir}/mochastackdriver_${suiteName}`
        fs.writeFileSync(`${filePath}`, JSON.stringify(fileObj), {force: true})
        console.log(`[mochastackdriver] Stackdriver-ready report saved to ${filePath}/mochastackdriver_${obj.stats.start}`)
      }

      if (!reporterOptions.onlyConsole && !reporterOptions.onlyFile && !reporterOptions.noCloud) {
        console.log("Trying to log, bitches")
        if (obj.failures.length > 0) log.error(result);
        else log.info(obj);
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
Please, supply Google Cloud Platform project ID and log name, and confirm output method(s) (cloud, console, file) are configured correctly and without conflict.
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
  if (!reporterOptions || !reporterOptions.stats) {
    return statsObject
  }
  else {
    const newStatsObject = {}
    reporterOptions.stats.forEach( item => {
      newStatsObject[item] = statsObject[item]
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
