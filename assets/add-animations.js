export function addAnimations(elements, animations, timeout) {
  elements.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add(...animations);
    }, timeout[i]);
  });
}
