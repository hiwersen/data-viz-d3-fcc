# D3.js Data Visualization Dashboard

An interactive data visualization dashboard featuring multiple chart types built with D3.js, including bar charts, heat maps, choropleth maps, scatter plots, and tree maps.

## Features

- Interactive chart navigation with hover and keyboard controls
- Responsive chart rendering with D3.js
- Multiple visualization types for different data representations
- Smooth transitions and animations
- Optimized image assets for fast loading
- Screen support: Fluid layout, from mobile (320px) to ultra-wide desktop (2560px)

- **Note**: Very small (<320px) or very large (>2560px) screens may have UI scaling issues

## Browser Compatibility

** Current Status: Chrome Desktop Optimized**

This application is currently **fully tested and optimized for Chrome on desktop environments**. While other browsers and devices may work, the following limitations apply:

### Fully Supported

- **Chrome 90+** (Desktop) - Complete functionality
- **Chrome 88+** (Desktop) - Recommended experience

### Limited Testing

- **Firefox, Safari, Edge** (Desktop) - Core functionality expected but not extensively tested
- **Mobile browsers** - Layout and interactions may not be optimal
- **Tablets** - Touch interactions not specifically optimized

### Known Limitations

- Mobile responsiveness requires additional development
- Touch event handling not implemented for mobile devices
- Performance on lower-end devices not optimized

## Technical Requirements

- Modern browser with ES6+ support
- JavaScript enabled
- Recommended screen resolution: desktop ranges
- Stable internet connection for external CDN resources

## Future Development

Cross-browser and mobile optimization are planned for future releases. Contributions for improving compatibility are welcome.

## Getting Started

1. Clone this repository
2. Open `index.html` in **Chrome (desktop)**
3. Navigate through charts using mouse hover or keyboard navigation

## Chart Types

- **Bar Chart** - Comparative data visualization
- **Heat Map** - Data density representation
- **Choropleth Map** - Geographic data mapping
- **Scatter Plot** - Correlation analysis
- **Tree Map** - Hierarchical data display

## Dependencies

- D3.js v7 (via CDN)
- TopoJSON v3 (via CDN)
- Modern browser APIs (ES6+)

## Performance

- Optimized images (WebP format with PNG fallback)
- Lighthouse Performance Score: 92/100 (Chrome Desktop)
- Total asset size: ~200KB

## Contributing

Contributions are welcome, especially for:

- Cross-browser compatibility improvements
- Mobile responsiveness
- Performance optimizations
- Additional chart types
- UX/UI

---

**Note**: This is an active development project. For the best experience, please use Chrome on desktop until cross-platform optimizations are implemented.
