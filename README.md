![Static Badge](https://img.shields.io/badge/status-WIP-blue)

A Chrome extension for connecting image sites to Bloom. It notices downloads of images, then tells Bloom where they are and where they came from. Bloom can then offer the images in a gallery for easy insertion. For image sites that have an API, Bloom can get the credit and license data for the image so that this can be automatically included in the book.

# Developing

1. Requires [Volta](https://github.com/volta-cli/volta)
2. `yarn install` will load dependencies.
3. `yarn dev` will put everything in the `dist/` folder and keep it up to date as you change files.
4. In Chrome, go to chrome://extensions
5. Enable "Developer mode"
6. Click "Load unpacked", choose the `dist/` folder produced by `yarn dev`
7. In the extension card named "Download to Bloom", click "Inspect views <u>service worker</u>". This will open a DevTools window for the extension.
8. As you make changes, the extension will automatically update.

Note that the `yarn dev` process in the terminal fails frequently. For workarounds, see https://github.com/crxjs/chrome-extension-tools/issues/538.
