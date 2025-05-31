export function addAnimations(elements, animations) {
  elements.forEach((el) => {
    el.classList.add(...animations);
  });

  console.log(elements);
}
