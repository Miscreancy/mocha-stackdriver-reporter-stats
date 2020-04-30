// Imports the Google Cloud client library
const { Logging } = require("@google-cloud/logging");

class CloudLogger {
  constructor(
    projectId = "YOUR_PROJECT_ID", // Your Google Cloud Platform project ID
    logName = "my-log" // The name of the log to write to
  ) {
    // Creates a client
    const logging = new Logging({ projectId });

    // Selects the log to write to
    this.log = logging.log(logName);
  }

  async info(message) {
    console.log("info", JSON.stringify(message));

    // The metadata associated with entries
    const metadata = {
      resource: { type: "global" },
    };

    // Prepares a log entry
    const entry = this.log.entry(metadata, message);

    // Writes the log entry
    await this.log.info(entry);
  }

  async error(message) {
    console.error("error", JSON.stringify(message));

    // The metadata associated with entries
    const metadata = {
      resource: { type: "global" },
    };

    // Prepares a log entry
    const entry = this.log.entry(metadata, message);

    // Writes the log entry
    await this.log.error(entry);
  }
}

module.exports = CloudLogger;
