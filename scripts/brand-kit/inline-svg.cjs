// Namespace paint/clip IDs because all ten SVGs share the gallery DOM.
module.exports = function inlineSvg(design) {
  const prefix = `${design.slug}-`;
  return design.svg
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}${id})`)
    .replace('<svg ', '<svg role="img" ');
};
