# Fabrknt Website

Official website for Fabrknt - The Precision Execution Stack for Solana.

## 🚀 Quick Deploy

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/fabrknt/fabrknt/tree/main/website)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd website
vercel
```

### Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/fabrknt/fabrknt)

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd website
netlify deploy --prod
```

### Deploy to GitHub Pages

1. Push the `website` directory to your repository
2. Go to Settings → Pages
3. Select the branch and `/website` folder
4. Save and wait for deployment

## 📁 Structure

```
website/
├── index.html              # Main landing page
├── docs.html              # Documentation page (optional)
├── assets/
│   ├── css/
│   │   └── styles.css     # All styles
│   ├── js/
│   │   └── main.js        # Interactive features
│   └── images/            # Images and logos
├── vercel.json            # Vercel configuration
├── netlify.toml           # Netlify configuration
├── .nojekyll              # GitHub Pages configuration
└── README.md              # This file
```

## 🎨 Customization

### Update Content

Edit `index.html` to customize:
- Hero section title and description
- Features and their descriptions
- Quick start code examples
- Use cases
- Footer links

### Update Styling

Edit `assets/css/styles.css` to customize:
- Color scheme (`:root` CSS variables)
- Typography
- Spacing and layout
- Responsive breakpoints

### Color Variables

```css
--primary: #8B5CF6;        /* Primary purple */
--secondary: #10B981;      /* Secondary green */
--accent: #F59E0B;         /* Accent orange */
--bg-primary: #0F172A;     /* Dark background */
--text-primary: #F8FAFC;   /* Light text */
```

### Add Images/Logo

1. Add your images to `assets/images/`
2. Update references in `index.html`
3. Recommended formats: SVG for logos, WebP for images

## 🛠️ Development

### Local Development

Simply open `index.html` in your browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then visit: `http://localhost:8000`

### Testing

- Test responsive design at different screen sizes
- Check all links work correctly
- Verify code copy buttons function
- Test on different browsers (Chrome, Firefox, Safari)

## 🌐 Domain Configuration

### Configure fabrknt.com

#### For Vercel:

1. Go to your project settings
2. Add custom domain: `fabrknt.com`
3. Add DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

#### For Netlify:

1. Go to Site settings → Domain management
2. Add custom domain: `fabrknt.com`
3. Follow Netlify's DNS instructions

#### For Cloudflare (Recommended):

1. Add your domain to Cloudflare
2. Point to your hosting provider
3. Enable:
   - SSL/TLS (Full mode)
   - Auto Minify (JS, CSS, HTML)
   - Brotli compression
   - Always Use HTTPS

## 📊 Analytics (Optional)

### Add Google Analytics

Add before `</head>` in `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Add Plausible Analytics (Privacy-friendly)

```html
<script defer data-domain="fabrknt.com" src="https://plausible.io/js/script.js"></script>
```

## 🔧 Features

- ✅ Fully responsive design
- ✅ Modern, clean UI
- ✅ Dark theme optimized for tech audience
- ✅ Fast loading (no external dependencies except fonts)
- ✅ SEO optimized with meta tags
- ✅ Code syntax highlighting
- ✅ Copy-to-clipboard functionality
- ✅ Smooth scroll navigation
- ✅ Mobile menu
- ✅ Animated elements on scroll

## 📝 SEO

The website includes:
- Semantic HTML5
- Meta descriptions
- Open Graph tags for social media
- Proper heading hierarchy
- Alt text for images (when added)

### Update SEO Tags

In `index.html`, update:
```html
<meta name="description" content="Your description">
<meta property="og:title" content="Your title">
<meta property="og:description" content="Your description">
```

## 🚀 Performance

Optimizations included:
- Minimal CSS/JS (no frameworks)
- Font preloading
- Efficient CSS animations
- Lazy loading ready
- Modern CSS Grid and Flexbox

### Further Optimizations

1. **Add a favicon**: Place `favicon.ico` in root
2. **Optimize images**: Use WebP format, compress images
3. **Add a manifest**: Create `manifest.json` for PWA support
4. **Enable caching**: Configure via hosting provider

## 🤝 Contributing

To update the website:

1. Edit files in the `website/` directory
2. Test locally
3. Commit changes
4. Deploy automatically via Git integration

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details

---

Built with ❤️  by **psyto** | Powered by **Solana**
