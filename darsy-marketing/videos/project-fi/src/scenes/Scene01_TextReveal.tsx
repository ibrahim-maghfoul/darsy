import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { COLORS, FONT_FAMILY, FONT_SIZE_BODY, CX, CY } from "../constants";

export const Scene01_TextReveal: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const translateY = interpolate(frame, [0, 15], [20, 0], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.BG_WHITE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      <p
        style={{
          fontSize: FONT_SIZE_BODY,
          color: COLORS.TEXT_DARK_GREY,
          textAlign: "center",
          letterSpacing: "-0.01em",
          maxWidth: 900,
          opacity,
          transform: `translateY(${translateY}px)`,
          margin: 0,
        }}
      >
        We set out to build a new way to connect.
      </p>
    </div>
  );
};
