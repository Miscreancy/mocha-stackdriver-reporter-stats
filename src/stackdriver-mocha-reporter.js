"use strict";

const Mocha = require("mocha");
const CloudLogger = require("./google-cloud-logger");

const {
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
} = Mocha.Runner.constants;

function StackdriverMochaReporter(runner, options) {
  const result = {
    passes: [],
    failures: [],
  };
  
  const { reporterOptions } = options;

  const log = new CloudLogger(
    reporterOptions && reporterOptions.projectId,
    reporterOptions && reporterOptions.logName
  );

  runner
    .on(EVENT_TEST_PASS, (test) => {
      result.passes.push(test.fullTitle());
    })
    .on(EVENT_TEST_FAIL, (test, err) => {
      result.failures.push({
        test: test.fullTitle(),
        message: err.message
      });
    })
    .once(EVENT_RUN_END, () => {
      if (result.failures.length > 0) log.error(result);
      else log.info(result);
    });
}

module.exports = StackdriverMochaReporter;
