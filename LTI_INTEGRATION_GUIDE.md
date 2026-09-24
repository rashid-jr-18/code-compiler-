# LTI 1.3 Integration with D2L Brightspace

This guide walks you through integrating the EduTech Code Compiler with D2L Brightspace using LTI 1.3.

## Overview

Learning Tools Interoperability (LTI) 1.3 allows your code compiler to be seamlessly integrated into D2L Brightspace as an external tool. Students and instructors can launch the compiler directly from within their courses.

## Prerequisites

1. Administrative access to your D2L Brightspace instance
2. A publicly accessible URL for your application (use ngrok for local development)
3. SSL certificate (required for LTI 1.3)

## Step 1: Register Your Tool in D2L Brightspace

### 1.1 Access the Admin Panel
1. Log into your D2L Brightspace as an administrator
2. Navigate to **Admin Tools** → **Manage Extensibility** → **LTI Advantage**

### 1.2 Create a New Tool Registration
1. Click **Register Tool**
2. Fill in the following information:

**Basic Information:**
- **Tool Name**: EduTech Code Compiler
- **Description**: Interactive code compiler for multiple programming languages
- **Tool URL**: `https://your-domain.com/api/lti/launch`
- **Custom Parameters**: (optional)

**Security Settings:**
- **Public Key Type**: JWK Set URL
- **Public Key/JWK Set URL**: `https://your-domain.com/.well-known/jwks.json`

**Privacy Settings:**
- **Send Institution Role**: Yes
- **Send Context Role**: Yes
- **Send User Name**: Yes (optional)
- **Send User Email**: Yes (optional)

### 1.3 Configure Message Types
Enable the following message types:
- **LtiResourceLinkRequest**: Yes
- **LtiDeepLinkingRequest**: Yes (optional)

### 1.4 Configure Placements
Add placements where the tool should appear:
- **Course Navigation**: Yes
- **Assignment Submission**: Yes (optional)
- **Content Market**: Yes (optional)

## Step 2: Configure Your Application

### 2.1 Update Environment Variables
Copy `.env.example` to `.env.local` and update:

```env
# LTI 1.3 Configuration
LTI_CLIENT_ID=your-client-id-from-d2l
LTI_SECRET=your-secret-from-d2l
LTI_ISSUER=https://your-d2l-instance.brightspace.com
LTI_KEYSET_URL=https://your-d2l-instance.brightspace.com/d2l/lti/authenticate/jwks
LTI_AUTH_URL=https://your-d2l-instance.brightspace.com/d2l/lti/authenticate

# Application URL
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### 2.2 Deploy Your Application
Ensure your application is accessible via HTTPS. For local development, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start your application
npm run dev

# In another terminal, expose port 3000
ngrok http 3000
```

## Step 3: Create Required Endpoints

The following endpoints are already implemented in this application:

### 3.1 LTI Launch Endpoint
- **URL**: `/api/lti/launch`
- **Method**: POST
- **Purpose**: Handles LTI launch requests from D2L

### 3.2 JWK Set Endpoint (To be implemented)
Create `/app/api/.well-known/jwks.json/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  // Return your public key set
  const jwks = {
    keys: [
      {
        kty: "RSA",
        use: "sig",
        kid: "your-key-id",
        n: "your-public-key-n-value",
        e: "AQAB"
      }
    ]
  };
  
  return NextResponse.json(jwks);
}
```

## Step 4: Test the Integration

### 4.1 Test Launch
1. Go to a course in D2L Brightspace
2. Navigate to **Content** → **Add Existing Activities**
3. Select **External Learning Tools**
4. Choose **EduTech Code Compiler**
5. Click **Insert**

### 4.2 Verify Functionality
1. Launch the tool from within D2L
2. Verify that user information is passed correctly
3. Test code compilation and execution
4. Ensure the interface loads properly within the D2L iframe

## Step 5: Advanced Configuration

### 5.1 Grade Passback (Optional)
To send grades back to D2L Brightspace, implement the LineItem service:

```typescript
// In your launch handler
const lineItem = launch.ags?.lineitem;
if (lineItem) {
  // Store lineitem URL for grade passback
  // Implement grade submission logic
}
```

### 5.2 Deep Linking (Optional)
For content selection, implement deep linking:

```typescript
// Handle deep linking requests
if (launch.messageType === 'LtiDeepLinkingRequest') {
  // Present content selection interface
  // Return deep linking response
}
```

### 5.3 Names and Roles Provisioning (Optional)
Access course roster information:

```typescript
// Use NRPS to get course members
const nrps = launch.nrps;
if (nrps) {
  // Fetch course members
  // Implement collaborative features
}
```

## Security Considerations

1. **Always use HTTPS** in production
2. **Validate JWT signatures** using D2L's public keys
3. **Implement proper session management**
4. **Sanitize user inputs** to prevent XSS attacks
5. **Use CSRF protection** for form submissions

## Troubleshooting

### Common Issues:

1. **Invalid JWT signature**
   - Verify the LTI secret is correct
   - Check that the public key URL is accessible
   - Ensure time synchronization between servers

2. **Tool not launching**
   - Verify the launch URL is correct
   - Check that the tool is properly registered
   - Ensure the application is accessible via HTTPS

3. **Missing user information**
   - Check privacy settings in D2L
   - Verify that the required claims are enabled
   - Review the LTI scope configuration

### Debug Mode:
Set `NODE_ENV=development` to enable detailed logging of LTI requests.

## Support

For additional help:
- Review D2L Brightspace LTI documentation
- Check the LTI 1.3 specification
- Contact your D2L system administrator

## Modern UI Features

The application includes:
- **Particle Background**: Animated particle system for a futuristic look
- **Glassmorphism**: Translucent elements with blur effects
- **Smooth Animations**: Framer Motion powered transitions
- **Confetti Celebrations**: Success animations when code runs
- **Gen Z Aesthetics**: Modern color schemes and typography
- **Responsive Design**: Works on all devices and screen sizes
