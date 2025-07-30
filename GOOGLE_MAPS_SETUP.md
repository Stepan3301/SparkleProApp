# Google Maps API Setup

## 🔧 **Setup Instructions**

### 1. **Create or Add to `.env` file in your project root:**

```env
# Add this to your .env file (create one if it doesn't exist)
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 2. **Get Your Google Maps API Key:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API (New)**
4. Create credentials → API Key
5. Restrict the key (recommended for security):
   - **Application restrictions**: HTTP referrers
   - **Add your domain**: `localhost:3000/*`, `yourdomain.com/*`
   - **API restrictions**: Select only the two APIs above

### 3. **Restart Your Development Server:**

After adding the API key, restart with:
```bash
npm start
```

### 4. **Test the Implementation:**

- Navigate to booking page → "New Address" 
- Navigate to profile → addresses → "Add New Address"
- You should see an address search input field with autocomplete
- The map should display and center when you select an address

## 🐛 **Troubleshooting**

### Issue: No search input appears
**Solution**: Check browser console for errors. Common issues:
- Missing or invalid API key
- APIs not enabled in Google Cloud Console
- Network restrictions blocking the script

### Issue: "Google Maps authentication failed"
**Solution**: 
- Verify API key is correct in `.env` file
- Check API key restrictions in Google Cloud Console
- Ensure billing is enabled for your Google Cloud project

### Issue: Autocomplete not working
**Solution**:
- Make sure both Maps JavaScript API and Places API are enabled
- Check that you're not hitting usage limits
- Verify your domain is allowed in HTTP referrer restrictions

## 💡 **Features You'll Get:**

✅ **New Places API (New)** with comprehensive address database  
✅ **Real-time autocomplete** with UAE address filtering  
✅ **Interactive maps** with precise location markers  
✅ **Automatic fallback** to legacy API if new API fails  
✅ **Enhanced debugging** with console logs  

## 📍 **Cost Information:**

- **Places Autocomplete**: $0.00282 per request
- **Place Details**: $0.017 per request  
- **Maps JavaScript API**: Free up to 28,000 map loads per month

The implementation is optimized to minimize costs by only fetching necessary fields.