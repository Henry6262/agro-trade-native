# Using ngrok for OAuth Development

Since Google OAuth doesn't allow IP addresses, you can use ngrok to create a public tunnel to your local backend.

## Installation

```bash
# Install ngrok (if not already installed)
brew install ngrok
```

## Setup

1. Start your backend on port 4000 (already running)

2. Create a tunnel to your backend:
```bash
ngrok http 4000
```

3. You'll get a URL like: `https://abc123.ngrok.io`

4. Add this to Google OAuth Console as authorized redirect URI:
```
https://abc123.ngrok.io/api/auth/google/callback
```

5. Update your frontend .env:
```
EXPO_PUBLIC_API_URL=https://abc123.ngrok.io/api
```

## Note
- ngrok URLs change each time you restart (unless you have a paid account)
- You'll need to update Google Console each time with the new URL
- This is good for testing but not ideal for regular development