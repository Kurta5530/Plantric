


<h1 align="center">
  <a href="https://github.com/LyvoAI/lyvo" target="_blank">
    <img src="https://github.com/user-attachments/assets/55dbdd6c-2b08-4e5f-a841-8fea7c2a0b92" alt="lyvo-logo" width="200" height="200">
  </a>
  <br>
  <small>Lyvo - Build Production-ready Agentic Workflow with Natural Language</small>
</h1>



[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://example.com/build-status) [![Version](https://img.shields.io/github/package-json/v/LyvoAI/lyvo?color=yellow)](https://lyvo.fellou.ai/docs/release/versions/)

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

https://github.com/user-attachments/assets/4087b370-8eb8-4346-a549-c4ce4d1efec3

Click [here](https://github.com/LyvoAI/lyvo-demos/tree/main/browser-extension-stock) to get the source code.

---

**Prompt:** `Based on the README of LyvoAI/lyvo on github, search for competitors, highlight the key contributions of Lyvo, write a blog post advertising Lyvo, and post it on Write.as.`

https://github.com/user-attachments/assets/6feaea86-2fb9-4e5c-b510-479c2473d810

Click [here](https://github.com/LyvoAI/lyvo-demos/tree/main/browser-extension-blog) to get the source code.

---

**Prompt:** `Clean up all files in the current directory larger than 1MB`

https://github.com/user-attachments/assets/ef7feb58-3ddd-4296-a1de-bb8b6c66e48b

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

https://github.com/user-attachments/assets/7716300a-c51d-41f1-8d4f-e3f593c1b6d5


Click [here](https://lyvo.fellou.ai/docs/browseruse/browser-web#example-login-automation-testing) to Learn more.

## Use Cases

- Browser automation and web scraping
- System file and process management
- Workflow automation
- Data processing and organization
- GUI automation
- Multi-step task orchestration

## Documentation

Visit our [documentation site](https://lyvo.fellou.ai/docs) for:

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

## Community and Support

- Report issues on [GitHub Issues](https://github.com/LyvoAI/lyvo/issues)
- Join our [slack community discussions](https://join.slack.com/t/lyvo-ai/shared_invite/zt-2xhvkudv9-nHvD1g8Smp227sM51x_Meg)
- Join our [Discard](https://discord.gg/XpFfk2e5):
![](discard.png)
- Contribute tools and improvements
- Share your use cases and feedback

<h1 align="center">
  <a href="https://github.com/LyvoAI/lyvo" target="_blank">
    <img width="663" alt="Screenshot 2025-02-05 at 10 49 58" src="https://github.com/user-attachments/assets/59708b7e-ff27-4bbd-8d42-c2309dbd1c7c" />
  </a>
</h1>

[![Star History Chart](https://api.star-history.com/svg?repos=LyvoAI/lyvo&type=Date)](https://star-history.com/#LyvoAI/lyvo&Date)

## License

Lyvo is released under the MIT License. See the [LICENSE](LICENSE) file for details.
