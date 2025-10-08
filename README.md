# Healthcare Portal - Patient Document Management System

A professional healthcare portal for managing patient documents with AI-powered clinical summaries.

## Features

- **Patient Management**: Add, view, and manage patient records
- **Document Upload**: Upload and organize patient medical documents
- **AI-Powered Summaries**: Generate comprehensive clinical summaries using Azure OpenAI
- **Professional UI**: Clean, mobile-friendly interface designed for healthcare professionals
- **Mock Database**: Works locally without external database dependencies

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: CSS with professional healthcare design
- **AI Integration**: Azure OpenAI for clinical document analysis
- **Database**: In-memory mock database (configurable for production)

## Getting Started

### Prerequisites

- Node.js 18+
- Azure OpenAI account (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd healthcare-portal
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Create .env.local file
VITE_USE_MOCK=true
VITE_AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
VITE_AZURE_OPENAI_API_KEY=your-api-key
VITE_AZURE_OPENAI_DEPLOYMENT=your-deployment-name
VITE_AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

4. Start development server:
```bash
npm run dev
```

5. Open http://localhost:5173 and sign in with your own credentials (mock accepts any non-empty email/password in local mode).

## Demo Credentials

Removed. In mock mode you can use any non-empty email/password to sign in.

## Deployment

### Azure Static Web Apps + Azure Functions (Recommended)

This project is ready to run fully on Microsoft Azure:

- Frontend: Azure Static Web Apps serves the React SPA.
- API: Azure Functions (in the `api/` folder) proxies Azure OpenAI via `/api/openai/summary` so keys never reach the browser.

#### 1) Provision Azure resources

- Create an Azure Static Web App (link to a GitHub repo or local CI).
- Ensure a Functions backend is enabled or create a Functions App using the SWA workflow.

#### 2) Configure environment variables (Azure Functions)

Set these on the Functions App (or SWA API) application settings:

- `AZURE_OPENAI_ENDPOINT`: your Azure OpenAI endpoint (e.g., `https://YOUR_RESOURCE.openai.azure.com`)
- `AZURE_OPENAI_API_KEY`: your Azure OpenAI API key
- `AZURE_OPENAI_DEPLOYMENT`: your deployment name (e.g., `gpt-4o-mini`)
- `AZURE_OPENAI_API_VERSION`: optional, default `2025-04-01-preview`

You do NOT need to expose these to the frontend. The client calls `/api/openai/summary` which is secured server-side.

#### 3) Configure SPA routing

`staticwebapp.config.json` is included to route SPA paths to `index.html` and allow `/api/*` passthrough.

#### 4) Build and deploy

- Configure SWA to build the frontend using `npm run build` with output folder `dist`.
- Set the API location to `api` (TypeScript Functions supported by SWA build or your CI).

### Local development with Azure Functions

```bash
npm install
# Frontend
npm run dev
# API (requires Azure Functions Core Tools)
npm run start:api
```

Set Functions local settings (e.g., `local.settings.json`, not committed) with the same keys as above.

## AI Features

The system includes intelligent document analysis:

- **Document Content Extraction**: Simulates reading PDF, DOCX, and other medical documents
- **Clinical Summary Generation**: AI analyzes document contents and generates structured summaries
- **Medical Insights**: Identifies abnormal values, trends, and clinical concerns
- **Fallback Support**: Graceful degradation to local summaries if AI is unavailable

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── PatientDetails.tsx
│   ├── DocumentUpload.tsx
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/               # Utilities and integrations
│   ├── supabase.ts    # Database client (mock/production)
│   └── ai.ts          # AI integration
└── App.tsx            # Main application
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue on GitHub.