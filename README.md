# Lyvo - Build Production-ready Agent Workflow with Natural Language

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://example.com/build-status) [![Version](https://img.shields.io/badge/version-1.0.5-yellow.svg)](https://lyvo.fellou.ai/docs/release/versions/)

**Lyvo** is a revolutionary framework designed to empower developers and users alike to program their browser and operating system using natural language. With seamless integration of browser APIs, OS-level capabilities, and cutting-edge AI tools like Claude 3.5, Lyvo redefines how we interact with technology, making it intuitive, powerful, and accessible.

# Framework Comparison

| Feature                              | Lyvo   | Langchain  | Browser-use  | Dify.ai  | Coze   | Midscene.js |
|--------------------------------------|-------|------------|--------------|----------|--------|-------------|
| **Supported Platform**               | All platform  | Server side  | Browser  | Web  | Web  | Web  |
| **One sentence to multi-step workflow** | ✅    | ❌          | ✅            | ❌        | ❌      | ❌           |
| **Intervenability**                  | ✅    | ✅          | ❌            | ❌        | ❌      | ❌           |
| **Development Efficiency**           | High  | Middle      | Middle        | Middle    | Low    | Middle       |
| **Open-source**                      | ✅    | ✅          | ✅            | ✅        | ❌      | ✅           |
| **Access to private web resources** | ✅ (Coming soon) | ❌          | ❌            | ❌        | ❌      | ❌           |

## Why Lyvo?

- **Natural Language Programming**: Transform human instructions into e- **Natural Language Programming**: Convert natural language task descriptions into executable workflows, making agent development more intuitive
- **Two-Layer Execution Model**: Separate offline planning from online execution, making agent decisions more structured and explainable
- **Comprehensive Tooling**: Rich built-in tools for browser automation, computer control, file operations, and web interactions
- **Hybrid Drive System:** Combine LLM capabilities with developer control, enabling "human in the loop" and allowing interference at multiple levels of granularity
- **Event-Driven Automation:** Trigger workflows based on browser or system events
- **Environment Flexibility**: Work across different environments ( [Browser Extension](/docs/browseruse/browser-extension), [Web](/docs/browseruse/browser-web), [Node.js](/docs/computeruse/computer-node), [Next-Gen AI Browser Fellou](/docs/computeruse/computer-fellou) ) with consistent APIs

## Quickstart

```bash
npm install @lyvo-ai/lyvo
```

> The following code is for reference only. For detailed usage, please refer to the [Lyvo Quickstart guide](https://lyvo.fellou.ai/docs/getting-started/quickstart/).

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

**Propmt:** `Open youtube, Search for Elon Musk, click on the first video, extract and summarize the content, and export as md`

https://github.com/LyvoAI/lyvo-docs/raw/refs/heads/main/public/load_extension.mov

Click [here](https://lyvo.fellou.ai/docs/browseruse/browser-extension/#example-search-elon-musk-in-youtube-and-summarize) to Learn more.

---

**Propmt:** `Search Sam Altman's information and summarize it into markdown format for export`

<video controls>
  <source src="https://lyvo.fellou.ai/docs/load_extension.mov" />
</video>

Click [here](https://lyvo.fellou.ai/docs/getting-started/quickstart/#creat-your-first-workflow) to Learn more.

---

**Propmt:** `Clean up all files in the current directory larger than 1MB`

<video controls>
  <source src="https://lyvo.fellou.ai/docs/nodejs_clean_computer.mov" />
</video>

Click [here](https://lyvo.fellou.ai/docs/computeruse/computer-node/#example-file-cleanup-workflow) to Learn more.

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
- [Fellou AI Browser](https://fellou.ai)

## Community and Support

- Report issues on [GitHub Issues](https://github.com/LyvoAI/lyvo/issues)
- Contribute tools and improvements
- Share your use cases and feedback
- Join our community discussions

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details on:

- Setting up the development environment
- Code style guidelines
- Submission process
- Tool development
- Use case optimization

## License

Lyvo is released under the MIT License. See the [LICENSE](LICENSE) file for details.
