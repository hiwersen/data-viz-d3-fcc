import { chartManager } from "../common.js";

export function initCarousel() {
  // console.log("hello carousel");
  // Get carousel elements
  const carousel = document.getElementById("carousel");
  const cardsContainer = document.getElementById("cards-container");
  const cards = document.querySelectorAll(".card-wrapper-1"); // Animate wrapper
  const start = Date.now();

  // Get slowFadeIn animation delay and set it to startOpacity
  let startOpacity = window
    .getComputedStyle(document.querySelector(".slowFadeIn"))
    .getPropertyValue("animation-delay");

  startOpacity = parseFloat(startOpacity.slice(0, -1)) * 1e3;

  // Set parameters
  let translateX = 0;
  let cardsCount = cards.length;
  const cardsCloned = 1;
  let cardWidth = cards[0].offsetWidth;

  let gap = Number(
    window
      .getComputedStyle(cardsContainer)
      .getPropertyValue("column-gap")
      .slice(0, -2)
  );

  const transition = window
    .getComputedStyle(cards[0])
    .getPropertyValue("transition");

  const transitionDuration =
    Number(
      window
        .getComputedStyle(cards[0])
        .getPropertyValue("transition-duration")
        .slice(0, -1)
    ) * 1000;

  // Set snap parameters
  const snapThreshold = (cardWidth + gap) * 0.5;
  const transitionDurationSnap = transitionDuration * 2;
  // Flag to prevent multiple concurrent translations
  let isSnapping = false;

  // Remove CSS snap settings
  cardsContainer.style.scrollSnapType = "none";

  cards.forEach((card) => {
    card.style.scrollSnapAlign = "none";
  });

  // Change cards container's flex-wrap from wrap to nowrap
  cardsContainer.style.flexWrap = "nowrap";

  // Clone and append ending cards
  const leftClone = cards[0].cloneNode(true);
  cardsContainer.append(leftClone);

  const rightClone = cards[cardsCount - 1].cloneNode(true);
  cardsContainer.prepend(rightClone);

  cardsCount = cardsContainer.children.length;

  // Set wheel speed based on cardsCount
  const wheelSpeed = cardsCount * 0.2;

  // Function to update x translation
  function updateTranslateX(deltaX, speed) {
    // Normalize wheel delta
    deltaX = Math.round(deltaX * speed);
    translateX += deltaX * -1;
  }

  // Function to perform regular translation with preset transition effect
  function translate() {
    [...cardsContainer.children].forEach((card, i) => {
      const z = getTranslateZQuadratic(i);
      card.style.transform = `translate3D(${translateX}px, 0px, ${z}px)`;

      // console.log(`z i: ${i}`, Math.round(z));
    });
    setZIndex();
    setOpacity();
    setAlphaX();

    // console.log("card width:", cardWidth);
    // console.log("gap:", gap);
  }

  // Function to perform a smooth snap translation - with prolonged transition effect
  function snap(direction) {
    // Set snapping flag to prevent wheel and touch events
    isSnapping = true;

    // Step 1: Complete full translation (to end position)
    const endPos = direction === "left" ? -cardWidth - gap : cardWidth + gap;
    translateX = endPos;

    // Translate cards to the end position with transition enabled for smooth effect
    [...cardsContainer.children].forEach((card) => {
      card.style.transition = `all ${transitionDurationSnap}ms ease-in-out`;
    });

    translate();
    pushLink();

    // Step 2: After full snap translation completes, reorganize DOM
    setTimeout(() => {
      shiftCards(direction);
    }, transitionDurationSnap);
  }

  // Function to shift the cards in the DOM
  function shiftCards(direction) {
    // Disable transitions before DOM manipulation
    disableTransitions();

    let clone;

    if (direction === "left") {
      // Remove left card
      cardsContainer.removeChild(cardsContainer.firstElementChild);

      // Clone and append left card
      clone = cardsContainer.children[cardsCloned].cloneNode(true);
      cardsContainer.append(clone);
    } else {
      // Remove right card
      cardsContainer.removeChild(cardsContainer.lastElementChild);

      // Clone and prepend right card
      const rightCloneIndex = cardsContainer.children.length - 1 - cardsCloned;
      clone = cardsContainer.children[rightCloneIndex].cloneNode(true);
      cardsContainer.prepend(clone);
    }

    // reset translation to 0 immediately after the DOM is reorganized
    // to create the illusion of continuous movement
    translateX = 0;

    translate();
    handleTouchCancel();

    // Re-enable regular translation and preset transition effect
    enableTranslationAndTransition();

    // Set event listeners for chart management
    chartManager.cardEventListeners(document.querySelector(".chart-image"));

    console.log(document.querySelector(".chart-image"));
  }

  // Function to temporarily disable transitions
  function disableTransitions() {
    [...cardsContainer.children].forEach((card) => {
      card.style.transition = "none";
    });
    cardsContainer.style.scrollBehavior = "";
    // Force reflow to ensure the transition change takes effect immediately
    cardsContainer.offsetHeight;
  }

  // Function to re-enable transitions
  function enableTranslationAndTransition() {
    // It happens after small delay of 100ms to ensure DOM changes are complete
    setTimeout(() => {
      // Release snapping lock
      isSnapping = false;
      // Reestablish original transition settings
      [...cardsContainer.children].forEach((card) => {
        card.style.transition = transition;
      });
      cardsContainer.style.scrollBehavior = "smooth";
    }, 100);
  }

  function getCarouselCenter() {
    return (cardWidth * cardsCount + gap * (cardsCount - 1)) / 2;
  }

  // Function to get the distance from the card's center to the carousel's center
  function getCardCenterFromCarouselCenter(i) {
    const carouselCenter = getCarouselCenter();
    // Card's center to the carousel's left
    const cardCenter = i * (cardWidth + gap) + cardWidth / 2;
    return Math.abs(cardCenter + translateX - carouselCenter);
  }

  // Function to get the card's normalized distance (0-1) from the center on the x-axis
  function normalizeX(i) {
    return (
      getCardCenterFromCarouselCenter(i) /
      (getCarouselCenter() - cardWidth * 0.5)
    );
  }

  function getZIndex(i) {
    const maxZIndex = cardsCount;
    return Math.ceil((maxZIndex - maxZIndex * normalizeX(i)) * 10);
  }

  function setZIndex() {
    [...cardsContainer.children].forEach((card, i) => {
      card.style.zIndex = `${getZIndex(i)}`;
    });
  }

  function pushLink() {
    [...cardsContainer.children].forEach((card, i) => {
      const cardId = card.querySelector(".card").getAttribute("id");
      const link = document.getElementById(cardId + "-link");
      const x = normalizeX(i);

      if (x === 0) {
        if (link && !link.classList.contains("pushed")) {
          link.classList.add("pushed");
        }
      } else if (link) {
        link.classList.remove("pushed");
      }
    });
  }

  function getTranslateZCircular(i) {
    // Get normalized distance x to center (0-1)
    const x = normalizeX(i);

    // Define radius of the circular arch
    const radius = Math.floor((cardsCount - 1) / 2) * 80;

    // Create a circular arch effect
    return radius * (Math.cos(x * Math.PI) - 1);
  }

  function getTranslateZQuadratic(i) {
    // Get normalized distance x to center (0-1)
    const x = normalizeX(i);

    // Define max z translation (deepest point of the arch)
    const maxZ = Math.floor((cardsCount - 1) / 2) * (cardWidth * 0.5);

    // Create a quadratic arch effect
    return -maxZ * Math.pow(x, 2);
  }

  function getOpacity(i) {
    // ! return 1; // !! DEBUGGING
    const x = normalizeX(i);

    const fadeStartDistance = 0.65;
    const fadeEndDistance = 1.0;

    if (x <= fadeStartDistance) {
      return 1;
    } else if (x >= fadeEndDistance) {
      return 0;
    } else {
      const fadeProgress =
        (x - fadeStartDistance) / (fadeEndDistance - fadeStartDistance);

      const easedProgress = 1 - Math.pow(1 - fadeProgress, 2);
      return 1 - easedProgress;
    }
  }

  function setOpacity() {
    const now = Date.now();
    const cards = [...cardsContainer.children];

    if (now - start < startOpacity) {
      cards.at(0).style.opacity = 0.75;
      cards.at(-1).style.opacity = 0.75;
      return;
    }

    cards.forEach((card, i) => {
      const opacity = getOpacity(i);
      card.style.opacity = opacity;
    });
  }

  function setAlphaX() {
    const cardsW1 = [...cardsContainer.children];

    cardsW1.forEach((cardW1, i) => {
      const x = normalizeX(i);
      let alphaX = 0;

      const fadeStartDistance = 0.25;
      const fadeEndDistance = 1.0;

      const fadeProgress =
        (x - fadeStartDistance) / (fadeEndDistance - fadeStartDistance);

      const easedProgress = 1 - Math.pow(1 - fadeProgress, 7.5);
      alphaX = Math.min(1 - easedProgress, 1);

      const card = cardW1.querySelector(".card");
      card?.style.setProperty("--alphaX", alphaX);
    });

    setHemisphere();
  }

  function setHemisphere() {
    const cardsW1 = [...cardsContainer.children];

    cardsW1.forEach((cardW1, i) => {
      let hemisphere = 0;

      const carouselCenter = getCarouselCenter();
      // Card's center to the carousel's left
      const cardCenter = i * (cardWidth + gap) + cardWidth / 2;
      const distance = cardCenter + translateX - carouselCenter;

      if (distance < 0) hemisphere = -1;
      if (distance > 0) hemisphere = 1;

      const card = cardW1.querySelector(".card");
      card?.style.setProperty("--hemisphere", hemisphere);
    });
  }

  function init() {
    disableTransitions();
    translate();
    enableTranslationAndTransition();

    setTimeout(() => {
      setOpacity();
    }, startOpacity);
  }

  init();

  /**
   * Handle window resize
   */

  window.addEventListener("resize", () => {
    cardWidth = cards[0].offsetWidth;
    gap = Number(
      window
        .getComputedStyle(cardsContainer)
        .getPropertyValue("column-gap")
        .slice(0, -2)
    );
    init();
  });

  /**
   * Hand wheel event
   */
  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      // Skip if snap translation is in progress
      if (isSnapping) return;

      updateTranslateX(e.deltaY, wheelSpeed);

      // Check for snap translation
      if (Math.abs(translateX) > snapThreshold) {
        if (translateX < 0) {
          snap("left");
        } else {
          snap("right");
        }
      } else {
        // Regular translation
        translate();
      }
    },
    { passive: false }
  );

  /**
   * Hand touch events
   */

  // Track touch positions
  const touchSpeed = 1.3;
  let touchStartX = null;
  let touchEndX = null;

  function handleTouchStart(e) {
    e.preventDefault();
    if (isSnapping) return;

    touchStartX = e.touches[0].clientX;
  }

  function handleTouchMove(e) {
    e.preventDefault();
    if (isSnapping) return;

    const touchMoveX = e.touches[0].clientX;
    touchStartX = touchStartX ?? touchMoveX;
    const touchDeltaX = touchMoveX - touchStartX;
    translateX = touchDeltaX * touchSpeed;

    // Check for snap translation
    if (Math.abs(touchDeltaX) > snapThreshold) {
      if (touchDeltaX < 0) {
        snap("left");
      } else {
        snap("right");
      }
    } else {
      // Regular translation
      translate();
    }
  }

  function handleTouchEnd(e) {
    if (isSnapping) return;

    touchEndX = e.changedTouches[0].clientX * touchSpeed;
    const touchDeltaX = touchEndX - touchStartX;

    // Check for snap translation
    if (Math.abs(touchDeltaX) > snapThreshold) {
      if (touchDeltaX < 0) {
        snap("left");
      } else {
        snap("right");
      }
    } else {
      // Return to initial position
      handleTouchCancel();
    }
  }

  function handleTouchCancel() {
    touchStartX = null;
    touchEndX = null;
    translateX = 0;
    translate();
  }

  carousel.addEventListener("touchstart", handleTouchStart, { passive: false });
  carousel.addEventListener("touchmove", handleTouchMove, { passive: false });
  carousel.addEventListener("touchend", handleTouchEnd);
  carousel.addEventListener("touchcancel", handleTouchCancel);

  /**
   * Hand right and left arrow key down events
   */

  let keyDownTime = null;

  window.addEventListener("keydown", (e) => {
    if (!keyDownTime && (e.key == "ArrowLeft" || e.key == "ArrowRight")) {
      keyDownTime = Date.now();
    }
  });

  window.addEventListener("keyup", (e) => {
    // Cancel action if user has held arrow key down longer than 2s
    if (Date.now() > keyDownTime + 2000) {
      keyDownTime = null;
      return;
    }

    if (isSnapping) return;

    const direction =
      e.key == "ArrowLeft" ? "left" : e.key == "ArrowRight" ? "right" : null;

    snap(direction);
    keyDownTime = null;
  });
}
