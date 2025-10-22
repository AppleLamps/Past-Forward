# Developer Guide: New Features

Quick reference for developers working with the new features.

## File Structure

```
lib/
  ├── indexedDBUtils.ts      # Database operations
  ├── zipExportUtils.ts      # ZIP creation
  └── (existing files)

components/
  ├── Gallery.tsx            # Gallery modal
  ├── BatchUploadProgress.tsx # Batch progress UI
  └── (existing files)

hooks/
  └── useImageGeneration.ts   # Updated: exports DECADE_PROMPTS

App.tsx                        # Updated: new state and handlers
```

## Key APIs

### IndexedDB Operations

```typescript
import { 
    saveGeneration, 
    getAllGenerations, 
    getGeneration,
    deleteGeneration,
    clearAllGenerations,
    GenerationRecord 
} from './lib/indexedDBUtils';

// Save
const record: GenerationRecord = {
    id: `gen-${Date.now()}`,
    timestamp: Date.now(),
    originalImageUrl: dataUrl,
    generatedImages: { '1950s': blobUrl, ... },
    metadata: { fileName: 'photo.jpg' }
};
await saveGeneration(record);

// Retrieve
const all = await getAllGenerations();
const one = await getGeneration(id);

// Delete
await deleteGeneration(id);
await clearAllGenerations();
```

### ZIP Export

```typescript
import { 
    createZipExport, 
    downloadZip,
    createAndDownloadZip 
} from './lib/zipExportUtils';

// One-step export
await createAndDownloadZip(generatedImages, 'filename');

// Or separate steps
const blob = await createZipExport(generatedImages);
downloadZip(blob, 'filename');
```

### Batch Processing

```typescript
// In App.tsx
const handleBatchUpload = async (files: File[]) => {
    // 1. Initialize batch items
    const items: BatchItem[] = files.map((file, i) => ({
        id: `batch-${Date.now()}-${i}`,
        fileName: file.name,
        status: 'pending',
        progress: 0,
    }));
    
    // 2. Process each file
    for (let i = 0; i < files.length; i++) {
        // Validate, generate, save
        // Update progress
    }
};
```

## Component Props

### Gallery

```typescript
interface GalleryProps {
    onClose: () => void;
    onSelectGeneration: (record: GenerationRecord) => void;
}
```

### BatchUploadProgress

```typescript
interface BatchUploadProgressProps {
    items: BatchItem[];
    totalProgress: number;
    isProcessing: boolean;
    onCancel?: () => void;
}

interface BatchItem {
    id: string;
    fileName: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    progress: number;
    error?: string;
}
```

### ImageUploader (Updated)

```typescript
interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
    onBatchSelect?: (files: File[]) => void;
    isBatchMode?: boolean;
}
```

## State Management

### New App State

```typescript
const [showGallery, setShowGallery] = useState(false);
const [isBatchMode, setIsBatchMode] = useState(false);
const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
const [batchProgress, setBatchProgress] = useState(0);
const [isProcessingBatch, setIsProcessingBatch] = useState(false);
```

## Common Tasks

### Add a generation to history

```typescript
const record: GenerationRecord = {
    id: `gen-${Date.now()}`,
    timestamp: Date.now(),
    originalImageUrl: uploadedImage,
    generatedImages: imageData,
    metadata: { fileName: 'My Photo' }
};
await saveGeneration(record);
```

### Load a generation from history

```typescript
const record = await getGeneration(id);
setUploadedImage(record.originalImageUrl);
// Display record.generatedImages
```

### Export to ZIP

```typescript
const imageData = {
    '1950s': blobUrl1,
    '1960s': blobUrl2,
    // ...
};
await createAndDownloadZip(imageData, 'my-generations');
```

### Process batch

```typescript
const files = Array.from(fileInput.files);
for (const file of files) {
    const validation = await validateImage(file);
    const images = await Promise.all(
        DECADES.map(d => generateDecadeImage(validation.dataUrl, prompt))
    );
    await saveGeneration({
        id: `gen-${Date.now()}`,
        timestamp: Date.now(),
        originalImageUrl: validation.dataUrl,
        generatedImages: Object.fromEntries(
            DECADES.map((d, i) => [d, images[i]])
        )
    });
}
```

## Error Handling

### IndexedDB Errors

```typescript
try {
    await saveGeneration(record);
} catch (error) {
    console.error('Failed to save:', error);
    showToast('Failed to save generation', 'error');
}
```

### ZIP Export Errors

```typescript
try {
    await createAndDownloadZip(images);
} catch (error) {
    console.error('ZIP creation failed:', error);
    showToast('Failed to create ZIP file', 'error');
}
```

### Batch Processing Errors

```typescript
try {
    // Process file
} catch (error) {
    setBatchItems(prev =>
        prev.map(item =>
            item.id === itemId
                ? { ...item, status: 'error', error: error.message }
                : item
        )
    );
}
```

## Performance Tips

1. **Batch Processing**: Process files sequentially to avoid memory spikes
2. **Blob URLs**: Always revoke unused blob URLs with `URL.revokeObjectURL()`
3. **IndexedDB**: Use indexes for faster queries
4. **ZIP Creation**: Large files may take time; show progress
5. **Memory**: Monitor memory usage in DevTools when processing multiple images

## Testing

### Unit Tests (Recommended)

```typescript
// Test IndexedDB
describe('indexedDBUtils', () => {
    it('should save and retrieve generations', async () => {
        const record = { /* ... */ };
        await saveGeneration(record);
        const retrieved = await getGeneration(record.id);
        expect(retrieved).toEqual(record);
    });
});

// Test ZIP
describe('zipExportUtils', () => {
    it('should create valid ZIP', async () => {
        const images = { '1950s': blobUrl };
        const zip = await createZipExport(images);
        expect(zip.type).toBe('application/zip');
    });
});
```

### Manual Testing

1. Open DevTools → Application → IndexedDB
2. Verify database and object store created
3. Save a generation and check IndexedDB
4. Download ZIP and verify contents
5. Test batch upload with 3-5 files

## Debugging

### Check IndexedDB

```javascript
// In browser console
const db = await new Promise(r => indexedDB.open('PastForwardDB').onsuccess = e => r(e.target.result));
const tx = db.transaction('generations', 'readonly');
const store = tx.objectStore('generations');
store.getAll().onsuccess = e => console.log(e.target.result);
```

### Monitor Blob URLs

```javascript
// Check active blob URLs
console.log(performance.memory);
```

### Batch Progress

```typescript
// Add logging
console.log(`Processing ${i + 1}/${files.length}: ${file.name}`);
console.log(`Progress: ${batchProgress}%`);
```

## Deployment Checklist

- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Gallery loads and displays
- [ ] Batch upload works
- [ ] ZIP export creates valid files
- [ ] IndexedDB persists across sessions
- [ ] Memory cleanup works (DevTools)
- [ ] Mobile responsive
- [ ] Error messages display correctly
- [ ] Toast notifications work

## Related Documentation

- `FEATURES_ADDED.md` - Feature overview
- `IMPROVEMENTS.md` - Previous improvements
- `README.md` - Project overview
