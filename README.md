# Overview

A Chrome extension for helping Nexus interview reservation.

# License

This project is licensed under the terms of the Apache 2.0 license. See `LICENSE`.

# Usage

Use developer mode in Chrome to install this extension from your local directory.

1. Download the repository files from Github.
2. Install it as Chrome extension.
   1. Enable developer mode in Chrome, and go to `chrome://extensions/` page. 
   2. Drag and drop the repository directory to Chrome.
3. Go to Trusted Traveler Programs interview schedule page (https://ttp.cbp.dhs.gov/)
4. Move to schedule page.
   1. Once moved, it starts to check availability periodically.
   2. When it finds open slot, it plays sound and moves to date selection page.
   3. It automatically goes back to landing page to refresh the session to avoid session timeout.
5. It shows count down at right-bottom of page.
   1. If you click the button, it will stop the auto-check.

# Customise

You can modify some parameters in contents.js file.

# Development

## Package
Package extension file
```console
npm run build
npm run package
# zip file will be created under build/
```
