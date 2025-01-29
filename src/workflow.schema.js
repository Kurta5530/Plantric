const workflowSchema = {
    version: String, // e.g., "1.0"
    workflow: {
      name: String, // Name of the workflow
      description: String, // Description of the workflow
      tasks: [
        {
          id: String, // Unique identifier for the task
          name: String, // Name of the task
          type: String, // Type of the task (e.g., "http_request", "custom_function")
          retries: Number, // Number of retries for the task
          retryDelay: String, // Delay between retries (e.g., "10s")
          timeout: String, // Timeout for the task (e.g., "1m")
          input: Object, // Object containing input parameters for the task
          output: String, // The output of the task
          dependencies: Array, // Array of task IDs that must complete before this task
          condition: String, // Condition to trigger a conditional task (if any)
          trueTask: Object, // Task to execute if condition is true (for conditional tasks)
          falseTask: Object, // Task to execute if condition is false (for conditional tasks)
        }
      ],
      scheduling: {
        cron: String, // Cron expression for scheduling
        timezone: String, // Timezone for the cron expression (e.g., "UTC")
      },
      errorHandling: {
        retries: Number, // Global retry count for the entire workflow
        retryDelay: String, // Global retry delay (e.g., "15s")
      },
      end: {
        onSuccess: String, // Task ID to execute on success
        onFailure: String, // Task ID to execute on failure
      },
    },
  };
  
export default workflowSchema;
  