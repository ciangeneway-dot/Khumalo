#!/bin/bash

# Azure Medical Practice System - Automated Deployment Script
# This script creates all Azure resources needed for the medical practice system

set -e

echo "🏥 Medical Practice System - Azure Deployment"
echo "=============================================="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    echo "❌ Please login to Azure first:"
    echo "   az login"
    exit 1
fi

# Configuration
RESOURCE_GROUP="medical-practice-rg"
LOCATION="eastus"
STORAGE_ACCOUNT="medicalpracticestorage$(date +%s)"
TABLE_NAME="medicaldata"
CONTAINER_NAME="patient-documents"
STATIC_WEB_APP="medical-practice-app-$(date +%s)"
OPENAI_RESOURCE="medical-practice-openai-$(date +%s)"
OPENAI_DEPLOYMENT="gpt-4o-mini"
B2C_TENANT="medicalpractice$(date +%s)"

echo "📋 Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   Storage Account: $STORAGE_ACCOUNT"
echo "   Static Web App: $STATIC_WEB_APP"
echo "   OpenAI Resource: $OPENAI_RESOURCE"
echo ""

# Create resource group
echo "🔧 Creating resource group..."
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --output table

# Create storage account
echo "🔧 Creating storage account..."
az storage account create \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Standard_LRS \
    --kind StorageV2 \
    --access-tier Hot \
    --https-only true \
    --output table

# Get storage account key
STORAGE_KEY=$(az storage account keys list \
    --resource-group $RESOURCE_GROUP \
    --account-name $STORAGE_ACCOUNT \
    --query '[0].value' \
    --output tsv)

# Create table
echo "🔧 Creating table storage..."
az storage table create \
    --name $TABLE_NAME \
    --account-name $STORAGE_ACCOUNT \
    --account-key $STORAGE_KEY \
    --output table

# Create blob container
echo "🔧 Creating blob container..."
az storage container create \
    --name $CONTAINER_NAME \
    --account-name $STORAGE_ACCOUNT \
    --account-key $STORAGE_KEY \
    --public-access off \
    --output table

# Create Static Web App
echo "🔧 Creating Static Web App..."
az staticwebapp create \
    --name $STATIC_WEB_APP \
    --resource-group $RESOURCE_GROUP \
    --source https://github.com/your-username/your-repo \
    --location "Central US" \
    --branch main \
    --app-location "/" \
    --output-location "dist" \
    --output table

# Get Static Web App deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name $STATIC_WEB_APP \
    --resource-group $RESOURCE_GROUP \
    --query properties.apiKey \
    --output tsv)

# Create OpenAI resource (if available in your region)
echo "🔧 Creating OpenAI resource..."
if az openai create \
    --name $OPENAI_RESOURCE \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku S0 \
    --output table 2>/dev/null; then
    
    # Deploy GPT-4o-mini model
    echo "🔧 Deploying GPT-4o-mini model..."
    az openai deployment create \
        --name $OPENAI_DEPLOYMENT \
        --resource-group $RESOURCE_GROUP \
        --resource-name $OPENAI_RESOURCE \
        --model-name gpt-4o-mini \
        --model-version "2024-07-18" \
        --capacity 10 \
        --output table
else
    echo "⚠️  OpenAI not available in this region. You'll need to create it manually."
    OPENAI_RESOURCE=""
fi

# Create Azure AD B2C tenant
echo "🔧 Creating Azure AD B2C tenant..."
az ad b2c tenant create \
    --tenant-name $B2C_TENANT \
    --display-name "Medical Practice" \
    --country-code "US" \
    --output table

echo ""
echo "✅ Azure resources created successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure Azure AD B2C application registration"
echo "2. Set up environment variables"
echo "3. Deploy your application"
echo ""
echo "🔑 Important Information:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Storage Account: $STORAGE_ACCOUNT"
echo "   Storage Key: $STORAGE_KEY"
echo "   Static Web App: $STATIC_WEB_APP"
echo "   Deployment Token: $DEPLOYMENT_TOKEN"
if [ ! -z "$OPENAI_RESOURCE" ]; then
    echo "   OpenAI Resource: $OPENAI_RESOURCE"
fi
echo "   B2C Tenant: $B2C_TENANT.onmicrosoft.com"
echo ""

# Create environment file
cat > .env << EOF
# Azure Storage Configuration
VITE_AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT
VITE_AZURE_STORAGE_ACCOUNT_KEY=$STORAGE_KEY

# Azure OpenAI Configuration (if created)
VITE_AZURE_OPENAI_ENDPOINT=https://$OPENAI_RESOURCE.openai.azure.com
VITE_AZURE_OPENAI_API_KEY=your_openai_key_here
VITE_AZURE_OPENAI_DEPLOYMENT=$OPENAI_DEPLOYMENT
VITE_AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Azure AD B2C Configuration (to be configured)
VITE_AZURE_CLIENT_ID=your_client_id_here
VITE_AZURE_TENANT_NAME=$B2C_TENANT
VITE_AZURE_POLICY_NAME=B2C_1_signupsignin

# Static Web App
AZURE_STATIC_WEB_APPS_API_TOKEN=$DEPLOYMENT_TOKEN
EOF

echo "📄 Environment file created: .env"
echo "   Please update the Azure AD B2C and OpenAI values manually"
echo ""
echo "💰 Estimated Monthly Cost: $50-150 (depending on usage)"
echo "   - Storage: ~$5-20"
echo "   - Static Web App: $0-20"
echo "   - OpenAI: $0-100 (pay-per-use)"
echo "   - B2C: $0-25"
echo ""
echo "🎉 Setup complete! Run 'npm run build && npm run deploy' to deploy your app."
