# Testing Checklist - New Features

## Pre-Testing Setup

- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Run `npm run build` to verify production build succeeds
- [ ] Run `npm run dev` to start development server
- [ ] Open browser DevTools (F12)
- [ ] Clear browser cache and IndexedDB before testing

---

## Feature 1: Gallery/History

### Basic Functionality

- [ ] Generate a photo (single image)
- [ ] Click "💾 Save" button
- [ ] Toast notification appears: "Generation saved to history!"
- [ ] Click "📷 Gallery" button
- [ ] Gallery modal opens with the saved generation
- [ ] Thumbnail displays correctly
- [ ] Timestamp shows correct date/time
- [ ] Filename displays

### Gallery Actions

- [ ] Click "Load" button on a generation
- [ ] Modal closes
- [ ] Generation loads and displays in results
- [ ] Toast shows: "Generation loaded from history!"
- [ ] All 6 decade images display correctly

### Delete Functionality

- [ ] Click "Delete" on a generation
- [ ] Generation is removed from gallery
- [ ] Toast shows: "Generation deleted"
- [ ] Gallery updates immediately

### Clear All

- [ ] Save 3+ generations
- [ ] Click "Clear All" button
- [ ] Confirmation dialog appears
- [ ] Click "OK" to confirm
- [ ] All generations deleted
- [ ] Gallery shows empty state message
- [ ] Toast shows: "All generations cleared"

### Gallery UI

- [ ] Gallery modal is responsive
- [ ] Desktop: 3-column grid
- [ ] Tablet: 2-column grid
- [ ] Mobile: 1-column grid
- [ ] Scrolling works for many items
- [ ] Close button (✕) works
- [ ] Click outside modal closes it

### IndexedDB Persistence

- [ ] Save a generation
- [ ] Refresh page (F5)
- [ ] Click Gallery
- [ ] Generation still appears
- [ ] Data persists across sessions

---

## Feature 2: ZIP Export

### Single Image ZIP

- [ ] Generate a photo
- [ ] Click "Download ZIP" button
- [ ] Toast shows: "Creating ZIP file..."
- [ ] ZIP file downloads automatically
- [ ] File named: `past-forward-generations.zip`
- [ ] Extract ZIP file
- [ ] Verify folder structure: `past-forward-images/`
- [ ] Verify all 6 images present:
  - [ ] 1950s.jpg
  - [ ] 1960s.jpg
  - [ ] 1970s.jpg
  - [ ] 1980s.jpg
  - [ ] 1990s.jpg
  - [ ] 2000s.jpg
- [ ] All images are valid JPG files
- [ ] Images display correctly when opened

### ZIP from Gallery

- [ ] Save a generation
- [ ] Open Gallery
- [ ] Click "ZIP" button on a generation
- [ ] ZIP downloads with date in filename
- [ ] Verify contents as above

### Error Handling

- [ ] Try to download ZIP before all images generate
- [ ] Toast shows: "Please wait for all images to finish generating"
- [ ] ZIP button disabled during download
- [ ] No partial ZIP created

### File Size

- [ ] Check ZIP file size (should be ~2-5MB)
- [ ] Verify compression is working
- [ ] Compare to individual image sizes

---

## Feature 3: Batch Upload

### Mode Toggle

- [ ] Click "Single Mode" button
- [ ] Button changes to "✓ Batch Mode"
- [ ] File input now accepts multiple files
- [ ] Click again to toggle back to "Single Mode"
- [ ] Button changes back

### Batch Upload - 3 Files

- [ ] Toggle to Batch Mode
- [ ] Click upload area
- [ ] Select 3 different image files
- [ ] Batch processing starts
- [ ] Progress component appears
- [ ] Shows "3 of 3 completed" header
- [ ] Overall progress bar visible
- [ ] Individual file progress bars show

### Progress Tracking

- [ ] Each file shows:
  - [ ] Filename
  - [ ] Status icon (○ pending, ⟳ processing, ✓ done, ✕ error)
  - [ ] Progress percentage
  - [ ] Progress bar
- [ ] Overall progress updates
- [ ] Status icons change as processing progresses

### Completion

- [ ] All 3 files complete
- [ ] Toast shows: "Batch processing complete! 3/3 images processed."
- [ ] App returns to idle state
- [ ] Batch Mode toggle still visible

### Auto-Save to History

- [ ] After batch completes
- [ ] Click Gallery
- [ ] All 3 generations appear in gallery
- [ ] Each has correct filename
- [ ] Each has correct timestamp

### Error Handling

- [ ] Upload 5 files, 1 invalid (non-image)
- [ ] Invalid file shows error status (✕)
- [ ] Error message displays
- [ ] Other files continue processing
- [ ] Toast shows: "Batch processing complete! 4/5 images processed."

### Large Batch

- [ ] Upload 10 files
- [ ] Processing takes longer
- [ ] Progress updates smoothly
- [ ] No UI freezing
- [ ] All files process successfully

### Mobile Batch Upload

- [ ] On mobile device/responsive view
- [ ] Toggle Batch Mode
- [ ] Select multiple files
- [ ] Progress component displays correctly
- [ ] Buttons are touch-friendly
- [ ] No layout issues

---

## Integration Tests

### Workflow 1: Single → Save → Load

- [ ] Generate single image
- [ ] Click Save
- [ ] Click Gallery
- [ ] Click Load
- [ ] Results display correctly

### Workflow 2: Batch → Gallery → ZIP

- [ ] Batch upload 3 files
- [ ] Open Gallery
- [ ] Click ZIP on one generation
- [ ] ZIP downloads
- [ ] Verify contents

### Workflow 3: Multiple Saves → Clear

- [ ] Generate and save 5 images
- [ ] Open Gallery
- [ ] Verify all 5 appear
- [ ] Click Clear All
- [ ] Confirm deletion
- [ ] Gallery empty

### Workflow 4: Batch → Individual Download

- [ ] Batch upload 2 files
- [ ] Click on first generation's 1950s image
- [ ] Download individual image
- [ ] Verify download works

---

## Performance Tests

### Memory Usage

- [ ] Open DevTools → Memory tab
- [ ] Take heap snapshot before
- [ ] Generate 6 images
- [ ] Take heap snapshot after
- [ ] Memory usage reasonable (~50-100MB)
- [ ] No memory leaks on reset

### Batch Processing Memory

- [ ] Monitor memory during batch upload
- [ ] Process 5 files
- [ ] Memory doesn't spike excessively
- [ ] Cleanup happens after each file

### ZIP Creation Time

- [ ] Time ZIP creation for 6 images
- [ ] Should complete in 2-5 seconds
- [ ] No UI freezing during creation

### Gallery Loading

- [ ] Save 20+ generations
- [ ] Open Gallery
- [ ] Loads quickly
- [ ] Scrolling is smooth
- [ ] No performance degradation

---

## Browser Compatibility

### Chrome/Edge

- [ ] All features work
- [ ] IndexedDB persists
- [ ] ZIP downloads correctly
- [ ] Batch upload works

### Firefox

- [ ] All features work
- [ ] IndexedDB persists
- [ ] ZIP downloads correctly
- [ ] Batch upload works

### Safari

- [ ] All features work
- [ ] IndexedDB persists
- [ ] ZIP downloads correctly
- [ ] Batch upload works

---

## Mobile Testing

### Responsive Design

- [ ] Test on iPhone (375px)
- [ ] Test on iPad (768px)
- [ ] Test on Android phone
- [ ] Gallery grid adapts
- [ ] Buttons are touch-friendly
- [ ] No horizontal scrolling

### Touch Interactions

- [ ] Tap Gallery button
- [ ] Tap Load button
- [ ] Tap Delete button
- [ ] Tap mode toggle
- [ ] All work smoothly

### Mobile Batch Upload

- [ ] Select multiple files
- [ ] Progress displays correctly
- [ ] No layout issues
- [ ] Scrolling works

---

## Error Scenarios

### Invalid Files

- [ ] Upload non-image file
- [ ] Error message displays
- [ ] Processing continues for valid files
- [ ] Toast shows partial completion

### Network Errors

- [ ] Simulate offline mode
- [ ] Try to generate
- [ ] Error handling works
- [ ] User gets feedback

### Storage Full

- [ ] Fill IndexedDB quota
- [ ] Try to save generation
- [ ] Error message displays
- [ ] User can clear history

### Large Files

- [ ] Upload 10MB image
- [ ] Validation catches it
- [ ] Error message: "File too large"
- [ ] No crash

---

## UI/UX Tests

### Visual Consistency

- [ ] All buttons styled consistently
- [ ] Colors match design
- [ ] Fonts correct
- [ ] Spacing consistent

### Animations

- [ ] Gallery modal animates smoothly
- [ ] Progress bars animate
- [ ] Buttons have hover effects
- [ ] No jank or stuttering

### Accessibility

- [ ] Tab navigation works
- [ ] Focus states visible
- [ ] Color contrast sufficient
- [ ] Error messages clear

### Toast Notifications

- [ ] Success messages appear
- [ ] Error messages appear
- [ ] Info messages appear
- [ ] Auto-dismiss works
- [ ] Multiple toasts stack

---

## Final Checklist

- [ ] All features tested
- [ ] No console errors
- [ ] No console warnings
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Cross-browser compatible
- [ ] Error handling works
- [ ] Documentation complete

---

## Sign-Off

**Tested By**: ___________________
**Date**: ___________________
**Status**: ☐ PASS ☐ FAIL

**Notes**:

```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## Known Issues (if any)

- [ ] None identified

---

## Recommendations

- [ ] Ready for production deployment
- [ ] Consider adding unit tests
- [ ] Monitor IndexedDB quota usage
- [ ] Track user engagement with new features
