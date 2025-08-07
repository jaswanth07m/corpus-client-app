# Corpus Frontend

This is the frontend application for the Corpus project. It allows users to contribute various types of content (text, audio, video, images) to a corpus, manage their profiles, and track their contributions.

## Features

- **User Authentication:** Secure login and session management.
- **Content Contribution:**
  - Upload text, audio, video, and image files.
  - Record audio and video directly from the browser.
  - Capture photos using the device camera.
  - **Mandatory Description Field:** All content uploads now require a description with a minimum length of 32 characters.
  - Location tagging for all contributions (via geolocation or manual input).
  - Robust chunked uploads for large files with retry mechanisms and progress tracking.
- **User Profile Management:**
  - View personal profile details.
  - Track daily and total contributions.
  - Breakdown of contributions by media type.
  - Export profile data (JSON, CSV).
- **Responsive Design:** Optimized for various screen sizes using Tailwind CSS and Shadcn/ui.

## Technologies Used

- **React:** Frontend library for building user interfaces.
- **TypeScript:** Superset of JavaScript for type-safe development.
- **Vite:** Fast build tool for modern web projects.
- **Tailwind CSS:** Utility-first CSS framework for rapid UI development.
- **Shadcn/ui:** Reusable UI components built with Radix UI and Tailwind CSS.
- **React Router DOM:** Declarative routing for React.
- **Zod & React Hook Form:** For form validation.
- **PostHog:** For product analytics.
- **Lucide React:** Icon library.
- **Sonner:** Toast notifications.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Bun (optional, but recommended for faster package management)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://code.swecha.org/Vamanakhil/corpusapp-frontend.git
    cd corpusapp-frontend
    ```
2.  Install dependencies:
    ```bash
    bun install
    # or npm install
    # or yarn install
    ```

### Configuration

The application connects to a backend API. Ensure the `BACKEND_URL` in `src/lib/constants.ts` is correctly set to your backend API endpoint.

```typescript
// src/lib/constants.ts
export const BACKEND_URL = 'https://api.corpus.swecha.org/api/v1';
```

### Running the Development Server

```bash
bun dev
# or npm run dev
# or yarn dev
```

This will start the development server, usually at `http://localhost:5173`.

### Building for Production

```bash
bun build
# or npm run build
# or yarn build
```

This will build the application for production into the `dist` directory.

## Project Structure

```
.
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, fonts, etc.
│   ├── components/         # Reusable React components
│   │   ├── ui/             # Shadcn/ui components
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions, constants, API helpers
│   ├── pages/              # Top-level page components (e.g., Index.tsx, NotFound.tsx)
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Entry point for React application
│   └── ...
├── .env                    # Environment variables
├── package.json            # Project dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── vite.config.ts          # Vite configuration
└── tsconfig.json           # TypeScript configuration
```

## Contributing

Refer to `CONTRIBUTING.md` for guidelines on how to contribute to this project.

## License

This project is licensed under the [LICENSE](LICENSE) file.
