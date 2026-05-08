import { Composition } from "remotion";
import { ProjectFi } from "./Composition";
import { FPS, WIDTH, HEIGHT, TOTAL_FRAMES } from "./constants";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ProjectFi"
        component={ProjectFi}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
