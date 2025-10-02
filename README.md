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

5. Open http://localhost:5173 and sign in with:
   - Email: `doctor@hospital.com`
   - Password: `demo1234`

## Demo Credentials

- **Email**: doctor@hospital.com
- **Password**: demo1234

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_AZURE_OPENAI_ENDPOINT`
   - `VITE_AZURE_OPENAI_API_KEY`
   - `VITE_AZURE_OPENAI_DEPLOYMENT`
   - `VITE_AZURE_OPENAI_API_VERSION`
3. Deploy automatically on push to main branch

### Manual Build

```bash
npm run build
npm run preview
```

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