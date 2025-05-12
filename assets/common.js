import { initCarousel } from "./carousel/index.js";
import { TextScramble } from "./text-scramble/index.js";
window.addEventListener("DOMContentLoaded", () => {
  // Initialize all scramble texts
  document.querySelectorAll(".scramble-text").forEach((el) => {
    const scrambler = new TextScramble(el);
    scrambler.start();
  });

  initCarousel();
});
