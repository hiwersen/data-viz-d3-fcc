// Dynamic letter spacing based on viewport width
function setDynamicLetterSpacing() {
  const viewportWidth = window.innerWidth;
  let letterSpacing;

  /* Letter spacing:
    @viewport width: 320px = 0.5em ~ @835 = 2em
    @viewport width: 836px = 1em ~ @1920 = 2em
  */

  if (viewportWidth > 1920) {
    // 2em
    letterSpacing = 2;
  } else if (viewportWidth >= 836) {
    // Linear interpolation between 836px (1em) and 1920px (2em)
    const progress = (viewportWidth - 836) / (1920 - 836); // 0 to 1
    letterSpacing = 1 + progress * 1; // 1em to 2em
  } else if (viewportWidth >= 320) {
    // Linear interpolation between 320px (0.5em) and 835px (2em)
    const progress = (viewportWidth - 320) / (835 - 320); // 0 to 1
    letterSpacing = 0.5 + progress * 1.5; // 0.5em to 1em
  }
  // Apply to title elements
  const titleElements = document.querySelectorAll("#title, #title-description");
  titleElements.forEach((element) => {
    element.style.letterSpacing = `${letterSpacing}em`;
  });
}

document.addEventListener("DOMContentLoaded", setDynamicLetterSpacing);

const resizeObserver = new ResizeObserver(setDynamicLetterSpacing);
resizeObserver.observe(document.body);
