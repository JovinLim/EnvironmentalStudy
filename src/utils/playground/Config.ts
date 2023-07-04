import { Vector2 } from 'three/src/math/Vector2';
import { Vector3 } from 'three/src/math/Vector3';
import { Euler } from 'three/src/math/Euler';
import { Color } from 'three/src/math/Color';

export module Config
{
  export const Background = Color.NAMES.FOG;

  export const Fog = {
    color: Color.NAMES.FOG,
    visible: true,
    near: 5.0,
    far: 1000.0
  };

  export const Camera = {
    position: new Vector3(200.0, -200.0, 100.0),
    target: new Vector3(0.0, 0.0, 0.0),
    fov: 50.0,
    near: 0.1,
    far: 5000.0
  };

  export const Lights = {
    ambient: {
      color: Color.NAMES.BLACK,
      intensity: 0.25
    },

    directional: {
      position: new Vector3(-15.0, 25.0, 50.0),
      rotation: new Euler(0.785, 0.0, 0.25),
      color: Color.NAMES.WHITE,
      intensity: 1.0,

      shadow: {
        mapSize: new Vector2(1024.0, 1024.0),
        cast: true,

        camera: {
          bottom: -25.0,
          right: 25.0,
          left: -25.0,
          near: 1.0,
          far: 50.0,
          top: 15.0
        }
      },

      helper: {
        color: Color.NAMES.WHITE,
        visible: true,
        size: 10.0
      }
    }
  };

  export const Ground = {
    color: Color.NAMES.WHITE,
    size: 500.0,
    cell: 26.0
  };
}