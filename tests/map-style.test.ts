import { createEmptyMapStyle, createRasterMapStyle } from "@/lib/map-style";

describe("map styles", () => {
  it("builds a blank bootstrap style for safe early map initialization", () => {
    const style = createEmptyMapStyle({
      backgroundColor: "#0f172a"
    });

    expect(style.version).toBe(8);
    expect(style.sources).toEqual({});
    expect(style.layers).toEqual([
      expect.objectContaining({
        id: "background",
        type: "background",
        paint: {
          "background-color": "#0f172a"
        }
      })
    ]);
  });

  it("builds inline raster styles without external style json dependencies", () => {
    const style = createRasterMapStyle({
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      attribution: "OpenStreetMap contributors",
      backgroundColor: "#ffffff"
    });

    expect(style.version).toBe(8);
    expect(style.sources).toEqual(
      expect.objectContaining({
        basemap: expect.objectContaining({
          type: "raster",
          tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"]
        })
      })
    );
    expect(style.layers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "background", type: "background" }),
        expect.objectContaining({ id: "basemap", type: "raster", source: "basemap" })
      ])
    );
  });
});
