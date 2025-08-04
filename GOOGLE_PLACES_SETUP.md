# Google Places Autocomplete Setup

This guide explains how to set up Google Places Autocomplete for automatic address filling in the VA Profile form.

## Features

- Automatic address search using Google Places API
- Intelligent parsing of Philippine addresses
- Auto-population of province, city, barangay, street address, and postal code
- Fallback to manual entry if needed

## Prerequisites

1. A Google Cloud Platform account
2. A project with billing enabled
3. Google Maps JavaScript API and Places API enabled

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project
4. Navigate to APIs & Services > Credentials
5. Click "Create Credentials" > "API Key"
6. Copy your API key

### 2. Enable Required APIs

In the Google Cloud Console:

1. Go to APIs & Services > Library
2. Search for and enable:
   - Maps JavaScript API
   - Places API

### 3. Configure API Key Restrictions (Recommended)

1. In APIs & Services > Credentials, click on your API key
2. Under "Application restrictions", select "HTTP referrers"
3. Add your allowed domains:
   - For development: `http://localhost:3000/*`
   - For production: `https://yourdomain.com/*`
4. Under "API restrictions", select "Restrict key" and choose:
   - Maps JavaScript API
   - Places API

### 4. Add API Key to Your Environment

Create a `.env` file in the `frontend` directory and add:

```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 5. Restart Your Development Server

After adding the environment variable, restart your React development server:

```bash
cd frontend
npm start
```

## Usage

1. On the VA Profile page (`/va/profile`), you'll see a "Quick Address Search" field
2. Start typing an address
3. Select from the dropdown suggestions
4. The form fields will automatically populate with:
   - Street Address
   - Province
   - City
   - Barangay (if available)
   - Postal Code

## How It Works

The integration uses the `GooglePlacesAutocomplete` component which:

1. Loads the Google Maps JavaScript API dynamically
2. Restricts search results to the Philippines
3. Parses address components from Google's response
4. Matches provinces and cities with the predefined Philippine locations
5. Updates form fields automatically

## Troubleshooting

### "Failed to load Google Maps API" Error

- Check that your API key is correctly set in the `.env` file
- Ensure the Maps JavaScript API and Places API are enabled
- Verify your API key has proper permissions

### Address Not Parsing Correctly

- Google's address data might not exactly match our predefined provinces/cities
- The system will still populate what it can and allow manual adjustment
- You can always manually select from the dropdowns after using autocomplete

### API Key Security

- Never commit your `.env` file to version control
- Use API key restrictions in production
- Monitor usage in Google Cloud Console to prevent abuse

## Cost Considerations

Google Places API has usage-based pricing:
- First $200 of usage per month is free
- Autocomplete (per session): $2.83 per 1,000 requests
- Place Details: $17.00 per 1,000 requests

For most applications, the free tier is sufficient.