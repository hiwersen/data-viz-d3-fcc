export function staggeredAnimation(elements, animations, staggeredDelay) {
  const timeout = [];

  elements.forEach((el, i) => {
    let duration = window
      .getComputedStyle(el)
      .getPropertyValue("animation-duration");

    duration = parseFloat(duration.slice(0, -1)) * 1000;

    let baseDelay = window
      .getComputedStyle(el)
      .getPropertyValue("animation-delay");

    baseDelay = parseFloat(baseDelay.slice(0, -1)) * 1000;

    const delay = baseDelay + staggeredDelay * Math.pow(i, 0.5);

    timeout.push(delay + duration);

    el.style.animationDelay = `${delay}ms`;

    animations.forEach((a) => {
      el.classList.add(a);
    });

    setTimeout(() => {
      animations.forEach((a) => {
        el.classList.remove(a);
        el.style.animationDelay = "";
      });
    }, timeout[i]);
  });

  return timeout;
}
