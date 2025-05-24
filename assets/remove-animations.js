export function removeAnimations(elements, animations, timeout) {
  elements.forEach((el, i) => {
    setTimeout(() => {
      el.classList.remove(...animations);
    }, timeout[i]);
  });
}
