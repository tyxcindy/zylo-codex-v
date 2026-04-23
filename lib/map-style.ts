import type { StyleSpecification } from "maplibre-gl";

export function createEmptyMapStyle(input?: { backgroundColor?: string }): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": input?.backgroundColor ?? "#e5e7eb"
        }
      }
    ]
  };
}

export function createRasterMapStyle(input: {
  tiles: string[];
  attribution: string;
  backgroundColor?: string;
}): StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: input.tiles,
        tileSize: 256,
        attribution: input.attribution
      }
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": input.backgroundColor ?? "#e5e7eb"
        }
      },
      {
        id: "basemap",
        type: "raster",
        source: "basemap"
      }
    ]
  };
}
