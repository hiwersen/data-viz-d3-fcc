import { TextScramble } from "./text-scramble/index.js";
import { staggeredAnimation } from "./staggered-animation.js";
import { addAnimations } from "./add-animations.js";
import { removeAnimations } from "./remove-animations.js";
import { UpdateChartDimensions } from "./updateChartDimensions.js";
import { ChartManager } from "./chartManager.js";

// Create and export ChartManager's instance
export const chartManager = new ChartManager();

const svgRatio = 1.6;

window.addEventListener("load", () => {
  // ! TODO: synchronize animation -
  // it is out of sync when you load the page from the address bar
  // the carousel initial position isn't consistent

  // Disable all transitions/animations for initial calculations
  document.body.classList.add("no-transitions");

  // document.getElementById("chart-modal").show();

  new UpdateChartDimensions(
    svgRatio,
    0.1, // 25% max-discount
    0.2
  );

  // Use RAF to ensure all layout calculations are complete
  requestAnimationFrame(() => {
    // Remove preload
    document.body.classList.remove("preload");

    // Re-enable transitions/animations
    document.body.classList.remove("no-transitions");

    // Initialize scramble text animation
    const scrambleText = document.querySelector(".scramble-text");
    new TextScramble(scrambleText).start();

    // Import carousel dynamically to avoid circular dependency
    // Otherwise: common.js imports carousel/index.js imports common.js (circular!)
    import("./carousel/index.js").then(({ initCarousel }) => {
      initCarousel();
    });

    // Initialize card animations
    const cardsW2 = document.querySelectorAll(".card-wrapper-2");
    staggeredAnimation(cardsW2, ["spinUp", "showUp"], 250);

    // Remove chart images' fade in animation
    const chartImageWrappers = document.querySelectorAll(
      ".chart-image-wrapper"
    );

    setTimeout(() => {
      removeAnimations(chartImageWrappers, ["slowFadeIn"]);
    }, 10100);

    // Add infiniteSpin to #cardsContainer after first spin
    const cardsContainer = document.querySelector("#cards-container");
    setTimeout(() => {
      // Remove initial spin animation
      cardsContainer.classList.remove("initialSpin");

      // Stop current animation completely
      // cardsContainer.style.animation = "none";

      // Force reflow to ensure animation stops
      cardsContainer.offsetHeight;

      // Start new infinite spin animation
      requestAnimationFrame(() => {
        cardsContainer.classList.add("infiniteSpin");
      });

      // console.log(cardsContainer.classList);
    }, 11100); // timing manually adjusted

    // logRem();
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
