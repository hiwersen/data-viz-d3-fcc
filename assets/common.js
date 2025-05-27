import { initCarousel } from "./carousel/index.js";
import { TextScramble } from "./text-scramble/index.js";
import { staggeredAnimation } from "./staggered-animation.js";
import { addAnimations } from "./add-animations.js";

window.addEventListener("load", () => {
  // ! TODO: synchronize animation -
  // it is out of sync when you load the page from the address bar
  // the carousel initial position isn't consistent

  requestAnimationFrame(() => {
    // Remove preload
    document.body.classList.remove("preload");

    // Initialize carousel animation
    initCarousel();

    // Initialize card animations
    const cards = document.querySelectorAll(".card-wrapper-2");
    staggeredAnimation(cards, ["spinUp", "showUp"], 250);

    // Initialize scramble text animation
    const scrambleText = document.querySelector(".scramble-text");
    new TextScramble(scrambleText).start();

    logRem();
  });
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
