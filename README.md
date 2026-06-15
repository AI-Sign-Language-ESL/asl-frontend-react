<a id="readme-top"></a>
<div align="center">
  <a href="https://github.com/AI-Sign-Language-ESL/asl-frontend">
    <img src="https://avatars.githubusercontent.com/u/228776460?s=400&u=c69294e3b9a90eed4ef31dc37ee3ced57c2add89&v=4"
         alt="TAFAHOM Logo"
         height="150"
         style="border-radius: 12px">
  </a>
  <h2 align="center">Tafahom Frontend</h2>
  <p align="center">
    User interface for the Tafahom Sign Language Translation Platform 🤟🧠<br />
    Graduation Project – Computer Science
    <br />
    <p align="center">
      <a href="https://techforpalestine.org/learn-more"><img alt="StandWithPalestine" src="https://raw.githubusercontent.com/Safouene1/support-palestine-banner/master/StandWithPalestine.svg"></a>
      <img alt="GitHub License" src="https://img.shields.io/github/license/AI-Sign-Language-ESL/asl-frontend">
      <img alt="GitHub issues" src="https://img.shields.io/github/issues/AI-Sign-Language-ESL/asl-frontend">
      <img alt="React" src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB">
      <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white">
      <img alt="Vite" src="https://img.shields.io/badge/Vite-B73BFE?logo=vite&logoColor=FFD62E">
      <img alt="Docker" src="https://img.shields.io/badge/docker-ready-blue">
    </p>
</div>

## About The Project ✨

**Tafahom Frontend** is the web interface for the Tafahom platform. It empowers users by providing an accessible, responsive, and seamless experience for interacting with advanced AI translation models. 

This application allows for:
- Sign Language Translation
- Real-time communication
- Voice and text interaction
- Meeting translation
- AI Assistant integration
- User management

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Key Features 🚀

- 🤟 **Real-time Sign Language Recognition**
- 📝 **Text to Sign Translation**
- 🎙️ **Speech to Text**
- 🔊 **Text to Speech**
- 📹 **Live Camera Recognition**
- 👥 **Meetings & Collaboration**
- 🤖 **AI Assistant (Fehm)**
- 📊 **Dashboard & Analytics**
- 🔐 **Authentication & Authorization**
- 🌐 **Responsive Design**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Tech Stack 🛠️

| Technology | Purpose |
|------------|---------|
| **React** | UI Library |
| **TypeScript** | Static Typing |
| **Vite** | Build Tool & Dev Server |
| **Redux Toolkit** | State Management |
| **React Router** | Client-side Routing |
| **Axios** | HTTP Client |
| **Tailwind CSS** | Utility-first Styling |
| **Material UI** | Component Library |
| **Socket.IO** | Real-time Communication |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Project Structure 📂

```text
src/
├── api/
├── assets/
│   ├── hand-animation.json
│   ├── hero.png
│   ├── react.svg
│   ├── tafahom-hero.jpg
│   └── vite.svg
├── components/
│   ├── CameraPreview.jsx
│   ├── ErrorBoundary.jsx
│   ├── FehmBot.jsx
│   ├── GoogleLoginButton.jsx
│   ├── Layout.jsx
│   ├── Navbar.jsx
│   ├── NotificationBell.jsx
│   ├── ParticlesBackground.jsx
│   ├── ProtectedRoute.jsx
│   ├── TranscriptErrorBoundary.jsx
│   ├── TranscriptPreview.jsx
│   ├── TranslationBox.jsx
│   └── TranslationHistory.jsx
├── context/
│   ├── AuthContext.jsx
│   ├── NotificationContext.jsx
│   └── ThemeContext.jsx
├── hooks/
│   ├── useAudioRecorder.js
│   ├── useMediaPipe.js
│   ├── useSpeechToText.js
│   ├── useUnity.js
│   └── useYoutubeTranscript.js
├── locales/
│   ├── ar.json
│   └── en.json
├── pages/
│   ├── AdminDashboard.jsx
│   ├── AdminLogin.jsx
│   ├── Dataset.jsx
│   ├── Generator.jsx
│   ├── Home.jsx
│   ├── HttpTranslationPage.jsx
│   ├── Login.jsx
│   ├── ManagePlan.jsx
│   ├── Meeting.jsx
│   ├── MyContributions.jsx
│   ├── OrgAdminLogin.jsx
│   ├── OrganizationAdmin.jsx
│   ├── PaymentCheckout.jsx
│   ├── Pricing.jsx
│   ├── Settings.jsx
│   ├── SignRecognitionPage.jsx
│   ├── SignTranslationPage.jsx
│   ├── Splash.jsx
│   ├── SupervisorDashboard.jsx
│   ├── SupervisorLogin.jsx
│   ├── TestTranslation.jsx
│   ├── Translator.jsx
│   └── YouTubeTranslate.jsx
├── routes/
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── translationWebSocket.js
│   └── youtubeTranscriptService.js
├── store/
├── types/
├── utils/
│   ├── errorHandler.js
│   └── tts.js
├── App.css
├── App.jsx
├── i18n.js
├── index.css
└── main.jsx
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started 🚀

Follow these steps to set up the project locally.

### Prerequisites 📦

- Node.js 20+
- npm or pnpm

### Installation ⚙️

1. Clone the repo
```sh
git clone https://github.com/AI-Sign-Language-ESL/asl-frontend.git
```

2. Navigate to the project directory
```sh
cd asl-frontend
```

3. Install dependencies
```sh
npm install
```

4. Create `.env` file at the root of the project:
```env
VITE_API_URL=http://localhost:8000
```

5. Run development server
```sh
npm run dev
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Environment Variables ⚙️

| Variable              | Description            |
| --------------------- | ---------------------- |
| `VITE_API_URL`        | Backend API URL        |
| `VITE_WS_URL`         | WebSocket URL          |
| `VITE_GOOGLE_CLIENT_ID`| Google OAuth Client ID |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Available Scripts 📜

In the project directory, you can run:

- `npm run dev`
  Runs the app in development mode using Vite. Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

- `npm run build`
  Builds the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

- `npm run preview`
  Bootups a local web server that serves the built solution from the `dist` folder for testing production builds locally.

- `npm run lint`
  Runs ESLint to find and fix problems in your TypeScript and React code.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Backend Connection 🔗

The frontend seamlessly connects with the Tafahom API through:

- **REST API Integration**: Standard HTTP requests (via Axios) for data fetching, CRUD operations, and user management.
- **WebSocket Integration**: Persistent, bi-directional connections for real-time sign language recognition, live meetings, and instant translations.
- **JWT Authentication**: Secure stateless authentication using JSON Web Tokens.
- **Google OAuth**: Single Sign-On (SSO) integration for quick and secure user onboarding.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Deployment 🚀

The project is configured for easy deployment across multiple platforms.

### Docker deployment
A `Dockerfile` is provided for containerized deployment.
```sh
docker build -t tafahom-frontend .
docker run -p 80:80 tafahom-frontend
```

### Vercel deployment
Simply link your GitHub repository to Vercel. Vercel will automatically detect the Vite framework and configure the build settings.

### Netlify deployment
Link your repository to Netlify. Use `npm run build` as the build command and `dist` as the publish directory.

### Production environment variables
Ensure that all variables from `.env` (like `VITE_API_URL`) are properly configured in your production environment's settings panel.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Screenshots 📸

### Landing Page
*(Insert Landing Page Screenshot Here)*

### Translation Dashboard
*(Insert Translation Dashboard Screenshot Here)*

### Live Recognition
*(Insert Live Recognition Screenshot Here)*

### Meeting Room
*(Insert Meeting Room Screenshot Here)*

### AI Assistant
*(Insert AI Assistant Screenshot Here)*

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing 👥

Contributions are welcome! To get started:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing-feature'`)
4. Push the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License 📜

Distributed under the GPL v3 License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
