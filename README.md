# Captured Moments - Luxury Photography Gallery

A complete, production-ready, frontend-only luxury photography gallery. Designed for high-end wedding and portrait photographers, it features an elegant masonry layout, seamless lazy loading, batch downloads, and a cinematic Lightbox experience. 

## Features
- **Frontend Only:** Fully static, compatible with GitHub Pages.
- **PIN Protected:** Client-side PIN barrier (default: `8881`).
- **Performance Optimized:** Uses `IntersectionObserver` to lazy-load chunks of 10 images at a time.
- **Luxury UI:** Designed using warm white, ivory, matte gold, with custom typography (Cormorant Garamond, Inter) and frosted glass effects.
- **Batch Download:** Users can select multiple photos and download them as a ZIP using JSZip.
- **Python Automation:** Scripts included to automatically hash image filenames and generate the JSON manifest.

## Setup Instructions

### 1. Add Your Photos
Place your high-resolution images (`.jpg`, `.jpeg`, `.png`, `.webp`) directly inside the `/photos` directory.

### 2. Prepare the Images (Hashing)
To prevent filename conflicts and maintain a clean structure, run the hashing script. This renames all images to their MD5 hash.
```bash
python python/hash_images.py
```

### 3. Generate JSON Manifest
The frontend relies on `photos.json` to know which images exist. Run the generation script:
```bash
python python/generate_json.py
```

### 4. Deploy to GitHub Pages
1. Initialize a git repository and commit your files.
2. Push to a repository on GitHub.
3. Go to the repository **Settings** > **Pages**.
4. Set the source to **Deploy from a branch**.
5. Select your `main` branch and `/root` folder, then save.
6. Your luxury gallery will be live in a few minutes!

## Technologies Used
- HTML5 / CSS3 / Vanilla JS
- Bootstrap 5 (CSS framework and layout)
- JSZip & FileSaver.js (Client-side ZIP generation)
- Python (Automation Scripts)
