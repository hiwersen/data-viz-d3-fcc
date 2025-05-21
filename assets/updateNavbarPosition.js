const navbar = document.querySelector("#navbar ul");
const chartContainer = document.getElementById("chart-container");
const pageContainer = document.getElementById("page-container");
const pagePadding = parseFloat(
  window
    .getComputedStyle(pageContainer)
    .getPropertyValue("padding")
    .slice(0, -2)
);

let x = null;

export function updateNavbarPosition() {
  // Reset translation
  navbar.style.transform = "none";

  const navbarRect = navbar.getBoundingClientRect();
  const navbarRightEdge = navbarRect.right;
  const navbarBottomEdge = navbarRect.bottom;

  const chartContainerRect = chartContainer.getBoundingClientRect();
  const chartContainerLeftEdge = chartContainerRect.left;
  const chartContainerTopEdge = chartContainerRect.top;

  x = x ?? navbarRightEdge;

  if (
    x >= chartContainerLeftEdge &&
    navbarRightEdge >= chartContainerLeftEdge &&
    navbarBottomEdge >= chartContainerTopEdge
  ) {
    console.log("@if -----  ");
    // Navbar is intersecting with chart area
    // Align navbar's right edge at chart container's left edge

    const translateX = chartContainerLeftEdge - x + pagePadding * 0.5;
    navbar.style.transform = `translateX(${translateX}px)`;
  } else {
    console.log("@else -----  ");
    // Reset translation
    x = null;
    navbar.style.transform = "";
  }

  navbar.style.top = `${chartContainerTopEdge}px`;

  /*
  console.log("navbarRightEdge:", navbarRightEdge);
  console.log("navbarBottomEdge:", navbarBottomEdge);
  console.log("chartContainerLeftEdge:", chartContainerLeftEdge);
  console.log("chartContainerTopEdge:", chartContainerTopEdge);
  console.log("transform:", navbar.style.transform);
  console.log("x:", x);
  */
}
