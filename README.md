# 🏥 Medical Practice Management System

A production-ready healthcare document management system built with React, TypeScript, and Azure services. Designed to handle 20,000+ medical documents with AI-powered analysis and HIPAA-compliant security. Pure Azure solution with no external dependencies.

## ✨ Features

### 🔐 Authentication & Security
- **Azure AD B2C** enterprise authentication
- **HIPAA-compliant** data handling
- **Secure access controls** for patient data
- **Secure document storage** with Azure Blob Storage

### 📋 Patient Management
- **Complete patient profiles** with demographics
- **Medical record numbers** and unique identifiers
- **Contact information** and address management
- **Patient search** and filtering

### 📄 Document Processing
- **Multi-format support**: PDF, DOCX, TXT, images (JPG, PNG, TIFF, BMP)
- **OCR processing** for scanned documents
- **Batch upload** for multiple files
- **Real-time processing** with progress tracking
- **Document validation** and medical relevance checking

### 🤖 AI-Powered Analysis
- **Azure OpenAI** integration for document summaries
- **Clinical data extraction** (vital signs, medications, diagnoses)
- **Intelligent document categorization**
- **Cost-optimized** processing with GPT-4o-mini

### 🚀 Production Ready
- **Azure Static Web Apps** deployment
- **CDN integration** for global performance
- **Automated CI/CD** with GitHub Actions
- **Monitoring and alerting** setup
- **Scalable architecture** for 20,000+ documents

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **CSS Modules** for styling
- **Responsive design** for all devices

### Backend & Database
- **Azure AD B2C** for authentication
- **Azure Table Storage** for data storage
- **Azure Blob Storage** for document storage

### Cloud Services
- **Azure OpenAI** for AI document processing
- **Azure Blob Storage** for secure document storage
- **Azure Static Web Apps** for hosting
- **Azure CDN** for global content delivery

### Document Processing
- **pdf-parse** for PDF text extraction
- **mammoth** for Word document processing
- **Tesseract.js** for OCR on images
- **Custom medical data extraction**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Azure account with $5000 credits
- Azure AD B2C tenant

### 1. Clone and Install
```bash
git clone <repository-url>
cd Khumalo
npm install
```

### 2. Azure Setup
Follow the detailed guide in [AZURE_SETUP.md](./AZURE_SETUP.md) to set up:
- Azure OpenAI Service
- Azure Blob Storage
- Azure AD B2C for authentication
- Azure Table Storage for database
- Azure Static Web Apps

### 3. Environment Configuration
Create a `.env` file:
```env
# Azure AD B2C
VITE_AZURE_CLIENT_ID=your_azure_ad_b2c_client_id
VITE_AZURE_TENANT_NAME=your_tenant_name
VITE_AZURE_POLICY_NAME=your_policy_name

# Azure OpenAI
VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
VITE_AZURE_OPENAI_API_KEY=your_api_key
VITE_AZURE_OPENAI_DEPLOYMENT=your_deployment_name
VITE_AZURE_OPENAI_API_VERSION=2025-04-01-preview

# Azure Storage
VITE_AZURE_STORAGE_ACCOUNT_NAME=your_storage_account
VITE_AZURE_STORAGE_ACCOUNT_KEY=your_storage_key
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 📊 Cost Analysis

### Monthly Costs for 20,000 Documents:
- **Azure OpenAI (GPT-4o-mini)**: ~$150-300
- **Azure Blob Storage**: ~$50-100
- **Azure Table Storage**: ~$5-20
- **Azure AD B2C**: ~$0-25
- **Azure Static Web Apps**: ~$0-20
- **Total**: ~$205-465/month

### Cost Optimization Features:
- ✅ GPT-4o-mini for cost efficiency
- ✅ LRS storage redundancy
- ✅ Document compression
- ✅ Batch processing
- ✅ Intelligent caching

## 🔒 Security & Compliance

### HIPAA Compliance
- **Encryption at rest** and in transit
- **Access controls** and audit logging
- **Data minimization** principles
- **Secure document storage** with private access
- **Row-level security** for patient data

### Security Features
- **HTTPS everywhere** with HSTS headers
- **Content Security Policy** (CSP)
- **XSS protection** and input validation
- **Secure authentication** with OAuth 2.0
- **Private document access** with signed URLs

## 🚀 Deployment

### Automatic Deployment
The application is configured for automatic deployment to Azure Static Web Apps via GitHub Actions.

### Manual Deployment
```bash
# Build the application
npm run build

# Deploy to Azure Static Web Apps
az staticwebapp deploy \
  --name your-app-name \
  --resource-group your-resource-group \
  --source-location dist
```

## 📈 Performance

### Optimizations
- **CDN integration** for global performance
- **Image optimization** and lazy loading
- **Code splitting** for faster initial load
- **Batch processing** for document uploads
- **Intelligent caching** for frequently accessed data

### Scalability
- **Horizontal scaling** with Azure Static Web Apps
- **Database indexing** for fast queries
- **Storage partitioning** by patient ID
- **API rate limiting** and throttling

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure
```
src/
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── LoginForm.tsx
│   ├── PatientList.tsx
│   ├── PatientDetails.tsx
│   ├── DocumentUpload.tsx
│   └── NewPatientModal.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/               # Utility libraries
│   ├── supabase.ts
│   ├── ai.ts
│   ├── azure-storage.ts
│   └── document-processor.ts
└── assets/            # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check [AZURE_SETUP.md](./AZURE_SETUP.md) for detailed setup
- **Issues**: Create an issue on GitHub
- **Azure Support**: Available through Azure Portal
- **Supabase Support**: Available through Supabase Dashboard

## 🎯 Roadmap

- [ ] **Mobile app** with React Native
- [ ] **Advanced analytics** dashboard
- [ ] **Integration** with EHR systems
- [ ] **Voice notes** and transcription
- [ ] **Advanced AI** features with custom models
- [ ] **Multi-tenant** support for multiple practices

---

Built with ❤️ for healthcare professionals who need efficient, secure, and cost-effective document management.