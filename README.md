![Nuwa AI Readme Background](./src/assets/readme-bg.png)

# Nuwa AI Client

A local-first AI chat client implemented for [Nuwa AI](https://nuwa.dev/) that enables users to create, share, and interact with Caps. 

> **Caps** (i.e. capability) are mini-apps in Nuwa AI, the minimium functional AI unit. Cap is designed to be an abstraction of AI models and agents. Currently it is the composation of Prompt, Model and MCP Servers.

## ✨ Features

### 🔐 Decentralized Identity & Crypto Payment
- **Decentralized Identity**: You control your data with DID-based authentication, fully anonymous
- **Crypto Payment**: Use cryptos to pay for your day-to-day AI
- **Data Portability**: Export and migrate your data anywhere

### 🎨 Modern User Experience
- **Shadcn UI**: Clean, responsive design with dark/light theme support
- **No MCP Configuration**: MCPs use DID authentication directly, eliminates the need for user to config


## 🚀 Beta Release

We're excited to announce the **Nuwa Client Beta**! This release includes:

- ✅ Core CAP creation and publishing functionality
- ✅ Web3 wallet integration
- ✅ Decentralized identity system
- ✅ MCP server integration
- ✅ Payment system


## 🛠️ Technology Stack

- **Framerwork**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: Zustand with persistence
- **Database**: Dexie (IndexedDB) for local storage
- **Identity**: DID from @nuwa-ai/identity-kit
- **Payment**: Payment Channel from @nuwa-ai/payment-kit
- **Cap Integration**: Cap integration from @nuwa-ai/cap-kit
- **Code Quality**: Biome for linting and formatting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/nuwa-protocol/nuwa-client.git
cd nuwa-client

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173` to start using Nuwa Client.

## 📖 Development

### Project Structure

```
src/
├── features/           # Feature-based modules
│   ├── auth/          # Authentication
│   ├── chat/          # Chat functionality
│   ├── cap-studio/    # CAP creation interface
│   ├── cap-store/     # CAP marketplace
│   ├── settings/      # User preferences
│   ├── sidebar/       # Navigation
│   └── wallet/        # Web3 integration
├── shared/            # Shared utilities and components
├── pages/             # Route components
└── layout/            # Layout components
```

Each feature follows a consistent structure:
- `components` - React components
- `hooks` - Custom React hooks  
- `stores` - Zustand state management
- `services` - Backend logics
- `types` - TypeScript definitions


## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## 🆘 Support

- **Documentation**: [docs.nuwa.dev](https://docs.nuwa.dev)
- **Issues**: [GitHub Issues](https://github.com/nuwa-protocol/nuwa-client/issues)
- **Community**: [Discord](https://discord.gg/nuwaai)
- **Email**: haichao@nuwa.dev

## 🎯 Roadmap

- [ ] Cap Inline UI Support 
- [ ] Cap Artifacts UI Support
- [ ] Multi-Modal Input Support
- [ ] Desktop App with Tauri

---

**Built with ❤️ by the Nuwa team**

Ready to experience the future of AI chat? [Try Nuwa Client Beta](https://test-app.nuwa.dev) today!
