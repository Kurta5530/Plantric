


<h1 align="center">
  <a href="https://github.com/LyvoAI/lyvo" target="_blank">
    <img src="https://github.com/user-attachments/assets/4f23ce74-bc6a-4222-80a1-e74e15c47343" alt="lyvo-logo" width="200" height="200">
  </a>
  <br>
  <small>Lyvo - Build Production-ready Agentic Workflow with Natural Language</small>
</h1>



[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://example.com/build-status)

Lyvo (pronounced like ‘echo’) is a production-ready JavaScript framework that enables developers to create reliable agents, **from simple commands to complex workflows**. It provides a unified interface for running agents in both **computer and browser environments**.

# Framework Comparison

| Feature                              | Lyvo   | Langchain  | Browser-use  | Dify.ai  | Coze   |
|--------------------------------------|-------|------------|--------------|----------|--------|
| **Supported Platform**               | **All platform**  | Server side  | Browser  | Web  | Web  |
| **One sentence to multi-step workflow** | ✅    | ❌          | ✅            | ❌        | ❌      |
| **Intervenability**                  | ✅    | ✅          | ❌            | ❌        | ❌      | 
| **Development Efficiency**           | **High**  | Low      | Middle        | Middle    | Low    | 
| **Task Complexity**           | **High**  | High      | Low        | Middle    | Middle    | Middle       |
| **Open-source**                      | ✅    | ✅          | ✅            | ✅        | ❌      |
| **Access to private web resources** | ✅ | ❌          | ❌            | ❌        | ❌      |

## Quickstart

```bash
npm install @lyvo-ai/lyvo
```

> Important Notice: The following example code cannot be executed directly. Please refer to the [Lyvo Quickstart guide](https://lyvo.fellou.ai/docs/getting-started/quickstart/) guide for instructions on how to run it.

```typescript
import { Lyvo } from '@lyvo-ai/lyvo';

const lyvo = new Lyvo({
  apiKey: 'your_anthropic_api_key',
});

// Example: Browser automation
const extWorkflow = await lyvo.generate("Search for 'Lyvo framework' on Google and save the first result");
await lyvo.execute(extWorkflow);

// Example: System operation
const sysWorkflow = await lyvo.generate("Create a new folder named 'reports' and move all PDF files there");
await lyvo.execute(sysWorkflow);

```

## Demos

**Prompt:** `Collect the latest NASDAQ data on Yahoo Finance, including price changes, market capitalization, trading volume of major stocks, analyze the data and generate visualization reports`.

https://github.com/user-attachments/assets/6fea2e87-5dc7-437c-9ea8-d4b60e1125f0

Click [here](https://github.com/LyvoAI/lyvo-demos/tree/main/browser-extension-stock) to get the source code.

---

**Prompt:** `Based on the README of LyvoAI/lyvo on github, search for competitors, highlight the key contributions of Lyvo, write a blog post advertising Lyvo, and post it on Write.as.`

https://github.com/user-attachments/assets/671a84b6-1073-40dd-acdf-a692c97de86c

Click [here](https://github.com/LyvoAI/lyvo-demos/tree/main/browser-extension-blog) to get the source code.

---

**Prompt:** `Clean up all files in the current directory larger than 1MB`

https://github.com/user-attachments/assets/7d88283c-5fce-4425-9b18-8f40d616a8e3

Click [here](https://lyvo.fellou.ai/docs/computeruse/computer-node/#example-file-cleanup-workflow) to Learn more.

---

**Prompt:** Automatic software testing
```
    Current login page automation test:
    1. Correct account and password are: admin / 666666 
    2. Please randomly combine usernames and passwords for testing to verify if login validation works properly, such as: username cannot be empty, password cannot be empty, incorrect username, incorrect password
    3. Finally, try to login with the correct account and password to verify if login is successful
    4. Generate test report and export
```

https://github.com/user-attachments/assets/3588a9c8-c00f-4985-819b-678454bfd14b


Click [here](https://lyvoai.github.io/lyvo-docs/browser-web#example-login-automation-testing) to Learn more.

## Use Cases

- Browser automation and web scraping
- System file and process management
- Workflow automation
- Data processing and organization
- GUI automation
- Multi-step task orchestration

## Documentation

Visit our [documentation site](https://lyvoai.github.io/lyvo-docs) for:

- Getting started guide
- API reference
- Usage examples
- Best practices
- Configuration options

## Development Environments

Lyvo can be used in multiple environments:

- Browser Extension
- Web Applications
- Node.js Applications

## License

Lyvo is released under the MIT License. See the [LICENSE](LICENSE) file for details.
