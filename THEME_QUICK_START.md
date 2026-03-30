# Theme System Quick Start Guide

## 🌙 Using the Theme Toggle

### As a User
1. Look for the **Moon/Sun icon** in your navigation header
2. Click it to switch between light and dark modes
3. Your preference is automatically saved
4. The theme persists even after closing the browser

### Locations
- **Admin Portal:** Top-right corner of header (next to Sign out)
- **Student Portal:** 
  - Desktop: Top-right corner of header
  - Mobile: Inline with navigation tabs

## 🎨 How It Works

### Theme Detection Priority
1. **Your saved preference** (localStorage) - used if available
2. **System preference** - detected from OS/browser settings if no saved preference
3. **Light mode** - default fallback

### Automatic Switching
- No page reload needed
- All colors transition smoothly (300ms)
- Works across all pages in real-time

## 💻 For Developers

### Add Theme Support to New Components

#### Simple Dark Mode Classes
```jsx
// Light theme class → Dark theme class
<div className="bg-white dark:bg-slate-900">
  <h1 className="text-slate-900 dark:text-white">Title</h1>
  <p className="text-slate-500 dark:text-slate-400">Description</p>
</div>
```

### Using the Theme Hook
```tsx
import { useTheme } from '@/context/ThemeContext'

export function MyComponent() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Switch Theme</button>
    </div>
  )
}
```

### Common Dark Mode Patterns

#### Backgrounds
```jsx
// Page backgrounds
className="bg-slate-100 dark:bg-slate-950"

// Card backgrounds  
className="bg-white dark:bg-slate-900"

// Secondary backgrounds
className="bg-slate-50 dark:bg-slate-800"
```

#### Text Colors
```jsx
// Primary text
className="text-slate-900 dark:text-white"

// Secondary text
className="text-slate-500 dark:text-slate-400"

// Tertiary text
className="text-slate-700 dark:text-slate-300"
```

#### Borders
```jsx
className="border-slate-200 dark:border-slate-800"
```

#### Interactive Elements
```jsx
className="hover:bg-slate-100 dark:hover:bg-slate-800"
className="focus:ring-blue-500 dark:focus:ring-blue-400"
```

#### Status Badges
```jsx
// Available status
className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"

// Booked status
className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
```

### Theme Context API

#### useTheme Hook
```typescript
interface ThemeContextValue {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const { theme, toggleTheme } = useTheme()
```

#### ThemeProvider
```tsx
// In App.tsx
import { ThemeProvider } from '@/context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}
```

## 🎨 Tailwind Dark Mode Reference

### Enable Dark Mode in tailwind.config.js
```js
module.exports = {
  darkMode: 'class',  // Uses class-based dark mode
  // ... rest of config
}
```

### Applying Dark Styles
```jsx
// When document.documentElement has class="dark"
// Tailwind applies dark: prefixed styles

<div className="bg-white dark:bg-slate-900">
  {/* Light: white, Dark: slate-900 */}
</div>
```

### CSS Selectors Generated
```css
/* Light mode */
.bg-white { background-color: #fff; }

/* Dark mode (when .dark is on html) */
.dark .dark\:bg-slate-900 { background-color: #0f172a; }
```

## 🔍 Testing Dark Mode

### Manual Testing
1. Click theme toggle button
2. Verify all UI updates correctly:
   - Backgrounds change
   - Text colors change  
   - Borders appear/disappear
   - Icons update
3. Reload page → theme persists
4. Open DevTools → check localStorage['slotaibook-theme']

### Browser DevTools
```javascript
// Check current theme
localStorage.getItem('slotaibook-theme')

// Set theme manually
localStorage.setItem('slotaibook-theme', 'dark')

// Check HTML class
document.documentElement.className // should include 'dark'
```

## 📋 Checklist for New Features

When adding new pages/components:

- [ ] Add dark mode classes to all background colors
- [ ] Add dark mode classes to all text colors
- [ ] Add dark mode classes to all borders
- [ ] Add dark mode classes to interactive states (hover, focus)
- [ ] Add dark mode classes to custom colored elements
- [ ] Test in both light and dark modes
- [ ] Check contrast ratios meet accessibility standards
- [ ] Verify smooth transitions on theme switch

## Color Reference Guide

### Text Colors
| Element | Light | Dark |
|---------|-------|------|
| Primary Heading | text-slate-900 | dark:text-white |
| Secondary Heading | text-slate-700 | dark:text-slate-200 |
| Body Text | text-slate-600 | dark:text-slate-300 |
| Helper Text | text-slate-500 | dark:text-slate-400 |

### Background Colors
| Element | Light | Dark |
|---------|-------|------|
| Page BG | bg-slate-100 | dark:bg-slate-950 |
| Card BG | bg-white | dark:bg-slate-900 |
| Input BG | bg-white | dark:bg-slate-800 |
| Hover BG | hover:bg-slate-50 | dark:hover:bg-slate-800 |

### Border Colors
| Element | Light | Dark |
|---------|-------|------|
| Main Border | border-slate-200 | dark:border-slate-800 |
| Light Border | border-slate-300 | dark:border-slate-700 |

## 🚀 Performance Tips

- ThemeProvider initializes synchronously (no flash)
- localStorage access is instant
- DOM class updates are atomic
- CSS transitions are GPU-accelerated
- No JavaScript runs on every color change

## 🐛 Troubleshooting

### Theme not persisting
- Check if localStorage is enabled
- Check browser DevTools: Application → Storage → LocalStorage
- Key should be: `'slotaibook-theme'`

### Dark mode not applying
- Check if `document.documentElement` has class `'dark'`
- Check if tailwind.config.js has `darkMode: 'class'`
- Clear browser cache and rebuild

### Styles not updating on toggle
- Ensure component uses `useTheme()` hook
- Check if ThemeProvider wraps entire App
- Verify dark: classes are spelled correctly

## 📚 Resources

- [Tailwind Dark Mode Docs](https://tailwindcss.com/docs/dark-mode)
- [React Context API](https://react.dev/reference/react/useContext)
- [localStorage MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

**Happy theming! 🎨**
