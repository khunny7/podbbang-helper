# Windows Store update

The existing Partner Center product is `31546YounghoonGim.Unofficial`. Submission 5, package version `0.1.6.0`, is currently in certification; the next package must therefore use the higher x64 version `0.1.7.0`. Keep the app package identity, publisher, publisher display name, and x64 architecture aligned with the existing product.

## Build the package

On Windows, from the repository root, run:

```powershell
npm ci
npm run build:store --workspace electronApp
```

The command builds the web client, creates an unsigned x64 `.appx` package for Store submission, and verifies the package manifest contains the existing identity and publisher with version `0.1.7.0`. The verified artifact is under `electronApp/dist/`.

The same build is available as the manual GitHub Actions workflow **Package Windows Store update**. It publishes only a downloadable build artifact; it does not upload or submit anything to Partner Center.

## Submit in Partner Center

1. Wait for Submission 5 to finish certification, then open the existing `팟빵 Unofficial` product and create a new submission.
2. Upload the verified `.appx` from the build artifact on the Packages page.
3. Check that Partner Center recognizes the existing product identity and x64 device support.
4. Review the listing, privacy policy URL, screenshots, and submission notes, then submit for certification. The updated policy is built at `/privacy-policy.html`; publish the web update before changing the listing URL to `https://podbbang-helper.piano8283.com/privacy-policy.html`.

The Microsoft Store re-signs Store packages, so this build does not use the tracked local PFX or a signing password. The PFX is excluded from Electron package files.
