export function removeAnimations(elements, animations) {
  elements.forEach((el) => {
    el.classList.remove(...animations);
  });

  // console.log(elements);
}
