import { initCarousel } from "./carousel/index.js";
import { TextScramble } from "./text-scramble/index.js";

window.addEventListener("DOMContentLoaded", () => {
  console.log(window.innerWidth, window.innerHeight);
  console.log(window.getComputedStyle(document.body).getPropertyValue("width"));
  console.log(
    window.getComputedStyle(document.body).getPropertyValue("height")
  );

  // Initialize all scramble texts
  document.querySelectorAll(".scramble-text").forEach((el) => {
    const scrambler = new TextScramble(el);
    // scrambler.start();
  });

  initCarousel();
});
