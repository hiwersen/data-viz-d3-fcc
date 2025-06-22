export function setTooltipPos(event, tooltip) {
  if (event.type === "mouseout") {
    tooltip
      .style("top", "-100dvh")
      .style("left", "-100dvw")
      .style("opacity", "0")
      .style("visibility", "hidden");
  } else if (event.type === "mouseover") {
    // Get tooltip dimensions
    const tooltipRect = tooltip.node().getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const margin = 5;

    // Define initial position and margin
    let top = event.pageY - 30;
    let left = event.pageX + 15;

    // Check if tooltip would extend beyond right edge of viewport
    if (left + tooltipWidth > viewportWidth - margin) {
      left = event.pageX - 15 - tooltipWidth; // Place it to the left
    }

    // Check if tooltip would extend beyond bottom edge of viewport
    if (top + tooltipHeight > viewportHeight - margin) {
      top = event.pageY + 30 - tooltipHeight; // Place it above cursor
    }

    // Check if tooltip would extend beyond left edge of viewport
    if (left < margin) {
      left = margin; // Keep it at the left margin
    }

    // Check if tooltip would extend beyond top edge of viewport
    if (top < margin) {
      top = margin; // Keep it at the top margin
    }

    // Apply position and make it visible
    tooltip
      .style("top", top + "px")
      .style("left", left + "px")
      .style("opacity", "1")
      .style("visibility", "visible");
  }
}
