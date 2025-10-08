# Azure Setup Guide for Medical Practice System

## Overview
This guide will help you set up Azure services for your medical practice management system with 20,000 document capacity. This is a pure Azure solution with no external dependencies.

## Required Azure Services

### 1. Azure OpenAI Service
**Estimated Cost: $200-400/month for 20,000 documents**

1. Create an Azure OpenAI resource:
   - Go to Azure Portal → Create Resource → Azure OpenAI
   - Choose your subscription and resource group
   - Select region (e.g., East US, West Europe)
   - Choose pricing tier: Standard (S0)

2. Deploy a model:
   - Go to your Azure OpenAI resource → Model deployments
   - Deploy `gpt-4o` or `gpt-4o-mini` (recommended for cost efficiency)
   - Set deployment name (e.g., "medical-gpt4")

3. Get your credentials:
   - Resource Management → Keys and Endpoint
   - Copy the endpoint URL and API key

### 2. Azure Blob Storage
**Estimated Cost: $50-100/month for 20,000 documents**

1. Create a storage account:
   - Go to Azure Portal → Create Resource → Storage Account
   - Choose your subscription and resource group
   - Select region (same as OpenAI for better performance)
   - Choose performance: Standard
   - Choose redundancy: LRS (Locally Redundant Storage) for cost efficiency

2. Create a container:
   - Go to your storage account → Containers
   - Create a new container named "patient-documents"
   - Set access level to "Private"

3. Get your credentials:
   - Access Keys → Show keys
   - Copy the storage account name and key

### 3. Azure AD B2C (Authentication)
**Estimated Cost: $0-25/month**

1. Create an Azure AD B2C tenant:
   - Go to Azure Portal → Create Resource → Azure AD B2C
   - Choose your subscription and resource group
   - Create a new B2C tenant or link to existing

2. Register your application:
   - Go to Azure AD B2C → App registrations
   - Register a new application
   - Set redirect URI to your app URL
   - Generate a client secret

3. Create user flows:
   - Go to User flows → New user flow
   - Create sign-up and sign-in flow
   - Configure user attributes

### 4. Azure Table Storage (Database)
**Estimated Cost: $5-20/month**

1. Enable Table Storage:
   - Go to your storage account → Tables
   - Create a new table named "medicaldata"
   - This will store all patient and document data

### 5. Azure Static Web Apps (Hosting)
**Estimated Cost: $0-20/month**

1. Create a Static Web App:
   - Go to Azure Portal → Create Resource → Static Web App
   - Choose your subscription and resource group
   - Select region
   - Choose hosting plan: Free (for small apps) or Standard

## Environment Variables

Create a `.env` file in your project root with:

```env
# Azure AD B2C Configuration
VITE_AZURE_CLIENT_ID=your_azure_ad_b2c_client_id
VITE_AZURE_TENANT_NAME=your_tenant_name
VITE_AZURE_POLICY_NAME=your_policy_name

# Azure OpenAI Configuration
VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
VITE_AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
VITE_AZURE_OPENAI_DEPLOYMENT=your_deployment_name_here
VITE_AZURE_OPENAI_API_VERSION=2025-04-01-preview

# Azure Storage Configuration
VITE_AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name_here
VITE_AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key_here
```

## Cost Optimization Tips

### For 20,000 Documents:
1. **Use GPT-4o-mini** instead of GPT-4o for document summaries (80% cost reduction)
2. **Enable Azure Storage compression** to reduce storage costs
3. **Use LRS redundancy** instead of GRS for storage (50% cost reduction)
4. **Implement document caching** to avoid re-processing
5. **Use batch processing** for multiple documents

### Monthly Cost Breakdown:
- Azure OpenAI (GPT-4o-mini): ~$150-300
- Azure Blob Storage (20,000 docs): ~$50-100
- Azure Static Web Apps: ~$0-20
- Supabase Pro: ~$25
- **Total: ~$225-445/month**

## Security Considerations

1. **Enable HTTPS** for all endpoints
2. **Use Azure Key Vault** for storing sensitive credentials
3. **Enable Row Level Security** in Supabase
4. **Implement audit logging** for HIPAA compliance
5. **Use Azure Private Endpoints** for production

## Performance Optimization

1. **CDN Setup**: Use Azure CDN for static assets
2. **Database Indexing**: Ensure proper indexes on patient_id, created_at
3. **Batch Processing**: Process documents in batches of 5-10
4. **Caching**: Implement Redis for frequently accessed data
5. **Monitoring**: Set up Azure Monitor for performance tracking

## Deployment Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   - Copy `.env.example` to `.env`
   - Fill in your Azure and Supabase credentials

3. **Build the application**:
   ```bash
   npm run build
   ```

4. **Deploy to Azure Static Web Apps**:
   - Use Azure CLI or GitHub Actions
   - Configure custom domain if needed

## Monitoring and Maintenance

1. **Set up alerts** for:
   - High API usage
   - Storage quota approaching limits
   - Failed document processing
   - Authentication errors

2. **Regular maintenance**:
   - Monitor costs weekly
   - Review document processing logs
   - Update dependencies monthly
   - Backup database regularly

## Troubleshooting

### Common Issues:
1. **CORS errors**: Ensure Azure Storage CORS is configured
2. **Authentication failures**: Check Google OAuth configuration
3. **Document processing errors**: Verify file types and sizes
4. **High costs**: Review API usage and optimize prompts

### Support:
- Azure Support: Available through Azure Portal
- Supabase Support: Available through Supabase Dashboard
- This application: Check logs in browser console
