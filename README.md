# SewNaija - Fashion Management PWA

A complete offline-first Progressive Web App for fashion businesses to manage customers, orders, and measurements. Built with React, TypeScript, and IndexedDB for full offline functionality.

## 🌟 Features

- **📱 Progressive Web App** - Installable, works offline
- **👥 Customer Management** - Add customers with photos and measurements
- **📋 Order Tracking** - Create orders with deadlines and photo uploads
- **🔍 Search Functionality** - Find customers and orders quickly
- **📅 Smart Dates** - All dates show day of the week
- **🌓 Dark/Light Theme** - Automatic theme switching
- **📱 Responsive Design** - Works on mobile and desktop
- **💾 Offline Storage** - IndexedDB for local data persistence

## 🚀 Live Demo

[View Live App](https://temzo007.github.io/sewnaija/)

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: TanStack Query, React Hook Form
- **Storage**: IndexedDB (native browser API)
- **PWA**: Vite PWA plugin, Service Workers
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## 📦 Installation

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/sewnaija.git
cd sewnaija

# Install dependencies
npm install

# Start development server
npm run dev:client

# Open http://localhost:5000
```

### GitHub Pages Deployment

The app automatically deploys to GitHub Pages on every push to the main branch.

To set up GitHub Pages for your fork:

1. Go to your repository settings
2. Navigate to "Pages" section
3. Select "GitHub Actions" as the source
4. The app will be available at `https://YOUR_USERNAME.github.io/sewnaija/`

## 🎯 Usage

### First Time Setup
1. Open the app
2. Complete the welcome setup
3. Start adding customers and orders

### Managing Customers
- Add customer photos and contact information
- Define custom measurements (bust, waist, hips, etc.)
- View customer details and order history

### Managing Orders
- Create orders with descriptions and deadlines
- Upload material photos and style images
- Track order status (pending/completed)
- Use the search bar to find orders quickly
- Click the floating action button (+) to add new orders

### Offline Functionality
- All data is stored locally in your browser
- Works completely offline
- Data syncs automatically when online

## 🏗️ Project Structure

```
sewnaija/
├── client/                 # Frontend React app
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and database
│   │   ├── pages/         # Page components
│   │   └── ...
│   └── index.html
├── server/                # Backend (for local development)
├── shared/                # Shared types and schemas
├── .github/workflows/     # GitHub Actions
└── package.json
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start client development server
npm run dev:client

# Build for production
npm run build:github

# Type checking
npm run check
```

## 📱 PWA Features

- **Installable**: Add to home screen on mobile devices
- **Offline-first**: Works without internet connection
- **Fast loading**: Cached resources for quick startup
- **Responsive**: Adapts to any screen size

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own fashion business!

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Icons from [Lucide](https://lucide.dev/)
- PWA functionality via [Vite PWA](https://vite-pwa-org.netlify.app/)

---

**Made with ❤️ for fashion businesses worldwide**