# 🎯 Theme System - Quick Reference Card

## 🌙 Single Click Theme Toggle

### Where to Click
- **Admin:** Header top-right (before Sign out)
- **Student:** Header top-right (desktop) or tabs (mobile)

### Icon Legend
```
🌙 Moon  = Currently in LIGHT mode → Click to go DARK
☀️ Sun   = Currently in DARK mode → Click to go LIGHT
```

### What Happens
1. Click icon → Instant switch
2. Colors animate smoothly (300ms)
3. Your preference auto-saves
4. Persists forever

---

## 🆘 Troubleshooting

### Theme Not Saving?
```
1. Check if localStorage is enabled
2. Open DevTools → Application → Storage
3. Look for 'slotaibook-theme' key
```

### Dark Mode Not Showing?
```
1. Clear browser cache
2. Reload page (Ctrl+R or Cmd+R)
3. Check if tailwind.config.js exists
4. Run: npm run build
```

### Need Light Mode Always?
```
Just don't click the toggle!
Or manually clear localStorage:
localStorage.setItem('slotaibook-theme', 'light')
```

---

## 🎨 For Developers

### Add Dark Mode to New Components

**Copy-Paste Template:**
```jsx
<div className="
  bg-white dark:bg-slate-900
  text-slate-900 dark:text-white
  border-slate-200 dark:border-slate-800
"
>
  <h1 className="text-slate-900 dark:text-white">Title</h1>
  <p className="text-slate-500 dark:text-slate-400">Description</p>
  <button className="
    bg-blue-600 dark:bg-blue-700
    hover:bg-blue-700 dark:hover:bg-blue-600
  ">
    Action
  </button>
</div>
```

### Use Theme Hook
```tsx
import { useTheme } from '@/context/ThemeContext'

function MyComponent() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? 'Go Dark' : 'Go Light'}
    </button>
  )
}
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/context/ThemeContext.tsx` | Theme logic & hook |
| `src/components/ThemeToggle.tsx` | Toggle button |
| `tailwind.config.js` | Dark mode config |
| `src/App.tsx` | Provider wrapper |
| `src/index.css` | Global dark styles |

---

## 🎯 Common Dark Mode Classes

```
BACKGROUNDS:
bg-white           → dark:bg-slate-900
bg-slate-50        → dark:bg-slate-800

TEXT:
text-slate-900     → dark:text-white
text-slate-700     → dark:text-slate-200
text-slate-500     → dark:text-slate-400

BORDERS:
border-slate-200   → dark:border-slate-800

INTERACTIVE:
hover:bg-slate-100    → dark:hover:bg-slate-800
focus:ring-blue-500   → dark:focus:ring-blue-400
```

---

## ✅ Features

✓ One-click toggle
✓ Persistent storage
✓ System preference detection
✓ Smooth 300ms transitions
✓ Dark & light modes
✓ Works everywhere
✓ Mobile responsive
✓ Accessible (WCAG)

---

## 📊 Color Palette

### Light Mode
- Background: White `#fff`
- Text: Dark gray `#0f172a`
- Accent: Blue `#2563eb`

### Dark Mode
- Background: Dark gray `#0f172a`
- Text: White `#fff`
- Accent: Light blue `#3b82f6`

---

## 🔧 Maintenance

### To Extend Dark Mode
1. Find component needing dark mode
2. Add `dark:` prefix versions of all classes
3. Test in both modes
4. Deploy

### To Change Colors
1. Edit `src/index.css` (global)
2. Edit component classes (specific)
3. Rebuild: `npm run build`

---

## 📚 Documentation

- `THEME_IMPLEMENTATION.md` - Full technical docs
- `THEME_QUICK_START.md` - Developer guide
- `THEME_SYSTEM_COMPLETE.md` - Summary
- `THEME_VISUAL_GUIDE.md` - Visual diagrams
- `FILES_CHANGED.md` - Complete file list

---

## 🚀 Status

✅ **READY TO USE**

- Build: PASSED
- Dev Server: Running
- All files: Updated
- Documentation: Complete

---

## 🎉 You're All Set!

Your Campus Sports Booking System now has a professional dark/light theme system!

**Just click the 🌙 icon and enjoy! ✨**
