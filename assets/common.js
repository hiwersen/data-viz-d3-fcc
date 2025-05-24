import { initCarousel } from "./carousel/index.js";
import { TextScramble } from "./text-scramble/index.js";
import { staggeredAnimation } from "./staggered-animation.js";
import { addAnimations } from "./add-animations.js";

window.addEventListener("DOMContentLoaded", () => {
  // Initialize scramble text animation
  const scrambleText = document.querySelector(".scramble-text");
  new TextScramble(scrambleText).start();

  // Initialize carousel animation
  initCarousel();

  // Initialize card animations
  const cards = document.querySelectorAll(".card-wrapper-2");
  const timeout = staggeredAnimation(cards, ["showUp", "spinUp"], 250);
  addAnimations(cards, ["fastFadeIn"], timeout);

  logRem();
});

window.addEventListener("resize", logRem);

function logRem() {
  console.log(
    "rem:",
    window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("font-size")
  );
}
