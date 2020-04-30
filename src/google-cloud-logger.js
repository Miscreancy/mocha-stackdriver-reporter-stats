// Imports the Google Cloud client library
const { Logging } = require("@google-cloud/logging");

class CloudLogger {
  constructor(projectId, logName) {
    // Creates a client
    const logging = new Logging({ projectId });

    // Selects the log to write to
    this.log = logging.log(logName);
  }

  async info(message) {
    // Prepares a log entry
    const entry = this.log.entry(message);

    // Writes the log entry
    await this.log.info(entry);
  }

  async error(message) {
    // Prepares a log entry
    const entry = this.log.entry(message);

    // Writes the log entry
    await this.log.error(entry);
  }
}

module.exports = CloudLogger;
