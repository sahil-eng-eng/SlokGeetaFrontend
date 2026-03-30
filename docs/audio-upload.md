# Audio Upload — How It Works

## Overview

The Kirtan Library supports uploading audio files for each track. Users can attach an audio file (MP3, WAV, OGG, etc.) to any Kirtan track entry, and the frontend will stream it via a built-in audio player.

---

## Frontend Flow

### 1. Track Creation
When a user adds a Kirtan track via **"Add Track"** in `KirtanLibraryPage.tsx`, the form captures:
- `title` — Track name
- `artist` — Artist/composer
- `album` / `raga` / `taal` / `duration_seconds` — Metadata fields
- `youtube_url` — Optional YouTube link

This creates the track entry in the database but does **not** yet contain audio.

### 2. Audio Upload (Separate Step)
After the track is created, audio can be attached via:

**Endpoint:** `POST /kirtan/tracks/{track_id}/audio`  
**Content-Type:** `multipart/form-data`  
**Field name:** `file`

**Frontend hook:**
```typescript
import { useUploadKirtanAudioMutation } from "@/lib/api/endpoints/kirtan";

const uploadAudio = useUploadKirtanAudioMutation();

// Usage:
const formData = new FormData();
formData.append("file", selectedFile);
uploadAudio.mutate({ trackId: track.id, formData });
```

The `file` input in `KirtanLibraryPage.tsx` shows an **"Upload Audio"** button that opens a native file picker and triggers this mutation.

---

## Backend Requirements

### Python Packages
```
python-multipart      # Required for FastAPI to parse multipart/form-data
aiofiles              # Required for async file I/O (if using local storage)
boto3                 # Required if using AWS S3
cloudinary            # Required if using Cloudinary
```

### Storage Backends

The backend can use one of three storage strategies:

#### Option A — Local Filesystem (Development Only)
```python
# In app/core/config.py
AUDIO_STORAGE_BACKEND = "local"
AUDIO_LOCAL_DIR = "./audio_uploads"  # Served via a static files mount
```
FastAPI static files setup:
```python
from fastapi.staticfiles import StaticFiles
app.mount("/audio", StaticFiles(directory="audio_uploads"), name="audio")
```

#### Option B — AWS S3 (Production Recommended)
```python
# In .env
AUDIO_STORAGE_BACKEND=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=ap-south-1
```
Backend stores the file in S3 and saves the public URL (or a pre-signed URL) in the `audio_url` field of the `kirtan_tracks` table.

#### Option C — Cloudinary
```python
# In .env
AUDIO_STORAGE_BACKEND=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

---

## Database Column

The `kirtan_tracks` table must have an `audio_url` column:
```sql
ALTER TABLE kirtan_tracks ADD COLUMN audio_url VARCHAR NULL;
```

This is stored as a nullable string — `NULL` means no audio has been uploaded yet.

---

## API Contract

### Upload Audio
```
POST /kirtan/tracks/{track_id}/audio
Content-Type: multipart/form-data

Body:
  file: <binary audio file>

Allowed MIME types:
  audio/mpeg, audio/wav, audio/ogg, audio/mp4, audio/flac

Max file size: 50MB (configurable in backend)

Response 200:
{
  "success": true,
  "message": "Audio uploaded successfully",
  "data": {
    "audio_url": "https://your-bucket.s3.amazonaws.com/tracks/abc123.mp3"
  }
}
```

### Get Track (includes audio_url)
```
GET /kirtan/tracks/{track_id}

Response 200:
{
  "success": true,
  "data": {
    "id": "...",
    "title": "...",
    "audio_url": "https://...",   // null if not uploaded
    "youtube_url": "https://...", // null if not added
    ...
  }
}
```

---

## Frontend Audio Player

When `audio_url` is set on a track, the Detail Panel in `KirtanLibraryPage.tsx` renders:

```tsx
<audio
  controls
  src={track.audio_url}
  className="w-full rounded-lg"
  preload="metadata"
/>
```

If both `audio_url` and `youtube_url` are present, the user can switch between them using tab buttons.

---

## Floating Player (Planned)

When the user navigates away from the Kirtan Library page while audio is playing, a floating mini-player should continue playback. This requires:

1. **`src/context/MediaPlayerContext.tsx`** — React context that holds:
   - `currentTrack: KirtanTrack | null`
   - `isPlaying: boolean`
   - `audioRef: RefObject<HTMLAudioElement>`
   - `setTrack(track)`, `play()`, `pause()`, `toggle()`

2. **`src/components/shared/FloatingMediaPlayer.tsx`** — Fixed bottom-right widget, shows only when:
   - A track is playing AND
   - Current route is NOT `/dashboard/kirtan`

3. **`DashboardLayout.tsx`** — renders `<FloatingMediaPlayer />` inside the layout.

The `<audio>` element must live in the context (not the page component) so it persists across route changes.

> **Status:** The floating player is planned but not yet implemented. The audio upload and track-level playback are fully working.

---

## Supported File Formats

| Format | MIME Type   | Notes                         |
|--------|-------------|-------------------------------|
| MP3    | audio/mpeg  | Most common, recommended      |
| WAV    | audio/wav   | Large files, lossless         |
| OGG    | audio/ogg   | Open source, good compression |
| M4A    | audio/mp4   | Apple format, widely supported|
| FLAC   | audio/flac  | Lossless, large files         |
