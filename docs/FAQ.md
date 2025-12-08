# Frequently Asked Questions

Common questions and troubleshooting guide.

## Table of Contents

- [General](#general)
- [Import Issues](#import-issues)
- [Code Generation](#code-generation)
- [Responsive Merge](#responsive-merge)
- [Privacy & Security](#privacy--security)
- [Troubleshooting](#troubleshooting)

---

## General

### What is Figma Code Export?

A local tool that transforms Figma designs into production-ready code. It imports your Figma nodes via the API and generates React/Tailwind, HTML/CSS, or other formats.

### Is it free?

Yes, completely free and open source (MIT license).

### Does it work offline?

**Partially.** You need internet to:
- Import new nodes from Figma
- Refresh existing nodes

Once imported, you can work completely offline:
- Browse your library
- Generate code
- Create merges
- Export files

### What Figma plans are supported?

All plans work:
- ✅ Free
- ✅ Professional
- ✅ Organization
- ✅ Enterprise

The only requirement is a personal access token.

### Is there a Figma plugin?

Not currently. This is a standalone web app that uses the Figma REST API. A plugin version may come in the future.

---

## Import Issues

### "Cannot access file" error

**Cause:** You don't have permission to view the Figma file.

**Solutions:**
1. Make sure you're logged into the correct Figma account
2. Ask the file owner to share it with you (View access is enough)
3. Check if the file is in a team you have access to

### "Invalid token" error

**Cause:** Your Figma API token is expired or invalid.

**Solutions:**
1. Go to [Figma Settings](https://www.figma.com/settings)
2. Scroll to **Personal Access Tokens**
3. Generate a new token
4. Update `.env.local` with the new token
5. Restart the dev server

### Import is very slow

**Cause:** Large files or slow network.

**Solutions:**
- Import smaller sections instead of entire pages
- Check your internet connection
- The Figma API has rate limits; wait a few minutes if you've made many requests

### Images are missing

**Cause:** Image export failed or file permissions.

**Solutions:**
1. Try refreshing the node (re-import from Figma)
2. Check if images are visible in Figma (not hidden layers)
3. Some image fills may not export correctly; try flattening in Figma

### Components don't import correctly

**Cause:** Component instances reference external libraries.

**Solutions:**
- Import the main component first, then instances
- Detach instances in Figma if you don't need the component link
- Check if the component library is accessible

---

## Code Generation

### Why is the code different from the Figma design?

Common reasons:
1. **Auto-layout vs absolute:** Use auto-layout in Figma for better flexbox output
2. **Constraints:** Figma constraints don't translate 1:1 to CSS
3. **Missing fonts:** Web fonts may render differently
4. **Rounding:** Pixel values are rounded to common Tailwind values

### Can I customize the output?

Yes! Use the **Rules Engine**:
1. Go to Rules page
2. Create custom rules to map Figma properties to specific classes
3. Rules take priority over default transformations

### How do I get cleaner class names?

Tips for cleaner output:
- Use Figma's auto-layout (becomes flexbox)
- Use consistent spacing (4px, 8px, 16px grid)
- Use design tokens/styles in Figma
- Name your layers meaningfully

### Why are there inline styles?

The generators try to use Tailwind utilities, but some values don't map to standard classes:
- Arbitrary colors (`bg-[#FF5733]`)
- Arbitrary spacing (`p-[13px]`)
- Complex gradients

To avoid this:
- Use Tailwind-compatible values in Figma
- Create custom rules to map to your design system

### Can I generate Vue/Svelte/Angular code?

Currently supported:
- ✅ React + Tailwind
- ✅ React + Tailwind v4
- ✅ HTML + CSS

Coming soon:
- 🔜 Vue + Tailwind
- 🔜 Svelte

The architecture is extensible—contributions welcome!

---

## Responsive Merge

### How does element matching work?

Elements are matched by **layer name** across breakpoints. For best results:
- Use identical names for the same element across mobile/tablet/desktop
- Keep consistent hierarchy structure
- Avoid duplicate names at the same level

### What if elements don't match?

Unmatched elements become breakpoint-specific:
- Element only in mobile → `block md:hidden`
- Element only in desktop → `hidden lg:block`

The merge viewer shows warnings for unmatched elements.

### Can I merge 2 breakpoints instead of 3?

Yes! You can select:
- Mobile + Desktop (skip tablet)
- Mobile + Tablet (skip desktop)
- Any combination

### Why are my responsive classes wrong?

Common issues:
1. **Different layer names:** "Button" vs "Btn" won't match
2. **Different hierarchy:** Elements nested differently won't match
3. **Duplicate names:** Multiple "Text" layers cause ambiguity

Solution: Ensure consistent naming in your Figma file.

### Can I edit the merged result?

The merged code is read-only in the app. To customize:
1. Export the code
2. Edit in your code editor
3. Or create rules to change the output

---

## Privacy & Security

### Where is my data stored?

**100% local.** All data stays on your machine:
- `figma-data/` — Imported nodes
- `merges-data/` — Saved merges
- `.env.local` — Your API token

Nothing is sent to external servers (except Figma API calls).

### Is my Figma token safe?

Your token is stored in `.env.local` which is:
- Gitignored (not committed)
- Only used for Figma API calls
- Never sent anywhere else

**Best practices:**
- Don't share your `.env.local` file
- Regenerate tokens periodically
- Use read-only tokens if possible

### Can I use this for client work?

Yes! Since everything runs locally:
- Client designs stay on your machine
- No data leaves your network
- You control all exports

Check your Figma/client agreements for any specific restrictions.

### Is the code I generate mine?

Yes. The generated code has no license restrictions from this tool. You own your output.

---

## Troubleshooting

### App won't start

**Check Node version:**
```bash
node --version  # Should be 18+
```

**Reinstall dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Check for port conflicts:**
```bash
# Use different port
PORT=3001 npm run dev
```

### Build fails

**Clear Next.js cache:**
```bash
rm -rf .next
npm run build
```

**Check TypeScript errors:**
```bash
npm run lint
```

### Preview doesn't render

**Possible causes:**
1. Browser blocking iframe content
2. Missing CSS/fonts
3. JavaScript errors

**Solutions:**
1. Check browser console for errors
2. Try a different browser
3. Disable ad blockers temporarily

### Changes don't appear

**Clear caches:**
1. Hard refresh: `Cmd/Ctrl + Shift + R`
2. Clear browser cache
3. Restart dev server

### Golden tests fail

**Update snapshots if intentional:**
```bash
npm run golden:capture
```

**Review changes:**
```bash
npm run golden:verify
```

---

## Still Need Help?

- [Open an issue](https://github.com/vincegx/Figma-Code-Export/issues)
- [Check existing issues](https://github.com/vincegx/Figma-Code-Export/issues?q=is%3Aissue)
- [Read the source code](https://github.com/vincegx/Figma-Code-Export)

---

[← Back to README](../README.md)
