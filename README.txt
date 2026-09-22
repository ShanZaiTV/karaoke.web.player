KARAOKE WEB PLAYER

Files:
- index.html
- style.css
- script.js
- config.js

SETUP
1. Create a Google Cloud project.
2. Enable "YouTube Data API v3".
3. Create an API key.
4. Put the key in config.js:
   const YOUTUBE_API_KEY = "YOUR_KEY";
5. Restrict the API key by HTTP referrer and API.
6. Serve the folder from a web server (recommended) rather than opening
   index.html directly as a file.

FEATURES
- YouTube karaoke search
- YouTube IFrame Player API playback
- Play/search results
- Add/remove queue
- LocalStorage queue persistence
- Automatically plays the next queued item after a video ends
- Responsive mobile/desktop UI
- Philippines region search

NOTES
The YouTube Data API is used for search. The YouTube IFrame Player API is
used for playback. Search results are limited to embeddable/syndicated videos.

For production, do not treat a browser-visible API key as a secret. Restrict
the key in Google Cloud Console or move API calls to your own backend.
