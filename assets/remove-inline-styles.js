export function removeInlineStyles(elements, inlineStyles, timeout) {
  elements.forEach((el, i) => {
    setTimeout(() => {
      inlineStyles.forEach((s) => {
        el.style[s] = "";
      });

      if (i == elements.length - 1) {
        // console.log(elements);
      }
    }, timeout[i]);
  });
}
