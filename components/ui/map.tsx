"use client";

import MapLibreGL, { type MarkerOptions, type PopupOptions } from "maplibre-gl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { Loader2, Locate, Maximize, Minus, Plus, X } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { createEmptyMapStyle, createRasterMapStyle } from "@/lib/map-style";
import { cn } from "@/lib/utils";

type MapContextValue = {
  map: MapLibreGL.Map | null;
  isLoaded: boolean;
};

export type MapViewportSnapshot = {
  center: { lng: number; lat: number };
  zoom: number;
  bounds: { west: number; south: number; east: number; north: number };
};

const MapContext = createContext<MapContextValue | null>(null);

function useMap() {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error("useMap must be used within a Map component");
  }

  return context;
}

const defaultStyles = {
  dark: createRasterMapStyle({
    tiles: [
      "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
    ],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    backgroundColor: "#0f172a"
  }),
  light: createRasterMapStyle({
    tiles: [
      "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
    ],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    backgroundColor: "#e9eef6"
  })
};

type MapStyleOption = string | MapLibreGL.StyleSpecification;

type MapProps = {
  children?: ReactNode;
  styles?: {
    light?: MapStyleOption;
    dark?: MapStyleOption;
  };
  onViewportChange?: (viewport: MapViewportSnapshot) => void;
} & Omit<MapLibreGL.MapOptions, "container" | "style">;

function DefaultLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--app-card-bg)]/40 backdrop-blur-sm">
      <div className="flex gap-1">
        <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--app-text-soft)]/80" />
        <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--app-text-soft)]/80 [animation-delay:150ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--app-text-soft)]/80 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function Map({ children, styles, onViewportChange, ...props }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreGL.Map | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { theme } = useTheme();
  const viewportChangeRef = useRef(onViewportChange);

  const mapStyles = useMemo(
    () => ({
      dark: styles?.dark ?? defaultStyles.dark,
      light: styles?.light ?? defaultStyles.light
    }),
    [styles]
  );
  const initialPropsRef = useRef(props);
  const initialThemeRef = useRef(theme);
  const initialMapStylesRef = useRef(mapStyles);

  useEffect(() => {
    viewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !containerRef.current) {
      return;
    }

    const mapStyle =
      initialThemeRef.current === "dark"
        ? initialMapStylesRef.current.dark
        : initialMapStylesRef.current.light;
    const mapInstance = new MapLibreGL.Map({
      container: containerRef.current,
      style: createEmptyMapStyle({
        backgroundColor: initialThemeRef.current === "dark" ? "#0f172a" : "#e9eef6"
      }),
      renderWorldCopies: false,
      attributionControl: { compact: true },
      ...initialPropsRef.current
    });

    const emitViewportChange = () => {
      const bounds = mapInstance.getBounds();
      const center = mapInstance.getCenter();

      viewportChangeRef.current?.({
        center: { lng: center.lng, lat: center.lat },
        zoom: mapInstance.getZoom(),
        bounds: {
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth()
        }
      });
    };

    const handleLoad = () => {
      setIsReady(true);
      emitViewportChange();
    };
    const handleStyleData = () => {
      if (mapInstance.isStyleLoaded()) {
        mapInstance.resize();
        setIsReady(true);
        emitViewportChange();
      }
    };
    const handleMapError = (event: { error?: unknown; sourceId?: string; tile?: unknown }) => {
      const message =
        event.error instanceof Error
          ? event.error.message
          : typeof event.error === "string"
            ? event.error
            : "Map resource failed to load.";

      console.warn("MapLibre non-fatal error:", {
        message,
        sourceId: event.sourceId ?? null,
        hasTile: Boolean(event.tile)
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      mapInstance.resize();
    });

    resizeObserver.observe(containerRef.current);
    requestAnimationFrame(() => mapInstance.resize());

    mapInstance.on("load", handleLoad);
    mapInstance.on("styledata", handleStyleData);
    mapInstance.on("error", handleMapError);
    mapInstance.on("moveend", emitViewportChange);
    mapRef.current = mapInstance;
    mapInstance.setStyle(mapStyle, { diff: false });

    return () => {
      resizeObserver.disconnect();
      mapInstance.off("load", handleLoad);
      mapInstance.off("styledata", handleStyleData);
      mapInstance.off("error", handleMapError);
      mapInstance.off("moveend", emitViewportChange);
      mapInstance.remove();
      mapRef.current = null;
      setIsReady(false);
    };
  }, [isMounted]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    setIsReady(false);
    mapRef.current.setStyle(theme === "dark" ? mapStyles.dark : mapStyles.light, { diff: false });
    requestAnimationFrame(() => {
      mapRef.current?.resize();
    });
  }, [mapStyles, theme]);

  return (
    <MapContext.Provider value={{ map: mapRef.current, isLoaded: isMounted && isReady }}>
      <div ref={containerRef} className="relative h-full w-full overflow-hidden rounded-[inherit]">
        {!isMounted || !isReady ? <DefaultLoader /> : null}
        {isMounted ? children : null}
      </div>
    </MapContext.Provider>
  );
}

type MarkerContextValue = {
  markerRef: React.RefObject<MapLibreGL.Marker | null>;
  markerElementRef: React.RefObject<HTMLDivElement | null>;
  map: MapLibreGL.Map | null;
  isReady: boolean;
};

const MarkerContext = createContext<MarkerContextValue | null>(null);

function useMarkerContext() {
  const context = useContext(MarkerContext);

  if (!context) {
    throw new Error("Marker components must be used within MapMarker");
  }

  return context;
}

type MapMarkerProps = {
  longitude: number;
  latitude: number;
  children: ReactNode;
  onClick?: (event: MouseEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  onDragStart?: (lngLat: { lng: number; lat: number }) => void;
  onDrag?: (lngLat: { lng: number; lat: number }) => void;
  onDragEnd?: (lngLat: { lng: number; lat: number }) => void;
} & Omit<MarkerOptions, "element">;

function MapMarker({
  longitude,
  latitude,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDrag,
  onDragEnd,
  draggable = false,
  ...markerOptions
}: MapMarkerProps) {
  const { map, isLoaded } = useMap();
  const markerRef = useRef<MapLibreGL.Marker | null>(null);
  const markerElementRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const markerOptionsRef = useRef(markerOptions);
  const clickRef = useRef(onClick);
  const mouseEnterRef = useRef(onMouseEnter);
  const mouseLeaveRef = useRef(onMouseLeave);
  const dragStartRef = useRef(onDragStart);
  const dragRef = useRef(onDrag);
  const dragEndRef = useRef(onDragEnd);

  useEffect(() => {
    markerOptionsRef.current = markerOptions;
    clickRef.current = onClick;
    mouseEnterRef.current = onMouseEnter;
    mouseLeaveRef.current = onMouseLeave;
    dragStartRef.current = onDragStart;
    dragRef.current = onDrag;
    dragEndRef.current = onDragEnd;
  }, [markerOptions, onClick, onDrag, onDragEnd, onDragStart, onMouseEnter, onMouseLeave]);

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    const container = document.createElement("div");
    markerElementRef.current = container;

    const marker = new MapLibreGL.Marker({
      ...markerOptionsRef.current,
      element: container,
      draggable
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;

    const handleClick = (event: MouseEvent) => clickRef.current?.(event);
    const handleMouseEnter = (event: MouseEvent) => mouseEnterRef.current?.(event);
    const handleMouseLeave = (event: MouseEvent) => mouseLeaveRef.current?.(event);

    container.addEventListener("click", handleClick);
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    const handleDragStart = () => {
      const lngLat = marker.getLngLat();
      dragStartRef.current?.({ lng: lngLat.lng, lat: lngLat.lat });
    };
    const handleDrag = () => {
      const lngLat = marker.getLngLat();
      dragRef.current?.({ lng: lngLat.lng, lat: lngLat.lat });
    };
    const handleDragEnd = () => {
      const lngLat = marker.getLngLat();
      dragEndRef.current?.({ lng: lngLat.lng, lat: lngLat.lat });
    };

    marker.on("dragstart", handleDragStart);
    marker.on("drag", handleDrag);
    marker.on("dragend", handleDragEnd);

    setIsReady(true);

    return () => {
      container.removeEventListener("click", handleClick);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
      marker.off("dragstart", handleDragStart);
      marker.off("drag", handleDrag);
      marker.off("dragend", handleDragEnd);
      marker.remove();
      markerRef.current = null;
      markerElementRef.current = null;
      setIsReady(false);
    };
  }, [draggable, isLoaded, latitude, longitude, map]);

  useEffect(() => {
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  useEffect(() => {
    markerRef.current?.setDraggable(draggable);
  }, [draggable]);

  useEffect(() => {
    if (!markerRef.current) {
      return;
    }

    const previous = markerOptionsRef.current;

    if (previous.offset !== markerOptions.offset) {
      markerRef.current.setOffset(markerOptions.offset ?? [0, 0]);
    }
    if (previous.rotation !== markerOptions.rotation) {
      markerRef.current.setRotation(markerOptions.rotation ?? 0);
    }
    if (previous.rotationAlignment !== markerOptions.rotationAlignment) {
      markerRef.current.setRotationAlignment(markerOptions.rotationAlignment ?? "auto");
    }
    if (previous.pitchAlignment !== markerOptions.pitchAlignment) {
      markerRef.current.setPitchAlignment(markerOptions.pitchAlignment ?? "auto");
    }

    markerOptionsRef.current = markerOptions;
  }, [markerOptions]);

  return (
    <MarkerContext.Provider value={{ markerRef, markerElementRef, map, isReady }}>
      {children}
    </MarkerContext.Provider>
  );
}

type MarkerContentProps = {
  children?: ReactNode;
  className?: string;
};

function MarkerContent({ children, className }: MarkerContentProps) {
  const { markerElementRef, isReady } = useMarkerContext();

  if (!isReady || !markerElementRef.current) {
    return null;
  }

  return createPortal(
    <div className={cn("relative cursor-pointer", className)}>
      {children ?? <DefaultMarkerIcon />}
    </div>,
    markerElementRef.current
  );
}

function DefaultMarkerIcon() {
  return <div className="relative h-4 w-4 rounded-full border-2 border-white bg-[color:var(--brand)] shadow-lg" />;
}

type MarkerPopupProps = {
  children: ReactNode;
  className?: string;
  closeButton?: boolean;
} & Omit<PopupOptions, "className">;

function MarkerPopup({
  children,
  className,
  closeButton = false,
  ...popupOptions
}: MarkerPopupProps) {
  const { markerRef, isReady } = useMarkerContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<MapLibreGL.Popup | null>(null);
  const [mounted, setMounted] = useState(false);
  const popupOptionsRef = useRef(popupOptions);

  useEffect(() => {
    if (!isReady || !markerRef.current) {
      return;
    }

    const container = document.createElement("div");
    containerRef.current = container;

    const popup = new MapLibreGL.Popup({
      offset: 16,
      ...popupOptionsRef.current,
      closeButton: false
    })
      .setMaxWidth("none")
      .setDOMContent(container);

    popupRef.current = popup;
    markerRef.current.setPopup(popup);
    setMounted(true);

    return () => {
      popup.remove();
      popupRef.current = null;
      containerRef.current = null;
      setMounted(false);
    };
  }, [isReady, markerRef]);

  useEffect(() => {
    if (!popupRef.current) {
      return;
    }

    const previous = popupOptionsRef.current;

    if (previous.offset !== popupOptions.offset) {
      popupRef.current.setOffset(popupOptions.offset ?? 16);
    }
    if (previous.maxWidth !== popupOptions.maxWidth && popupOptions.maxWidth) {
      popupRef.current.setMaxWidth(popupOptions.maxWidth);
    }

    popupOptionsRef.current = popupOptions;
  }, [popupOptions]);

  if (!mounted || !containerRef.current) {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "relative rounded-[22px] border border-[color:var(--line)] bg-[color:var(--app-card-bg)] p-3 text-[color:var(--app-text)] shadow-[0_28px_70px_rgba(15,23,42,0.24)] backdrop-blur-xl",
        className
      )}
    >
      {closeButton ? (
        <button
          type="button"
          onClick={() => popupRef.current?.remove()}
          className="absolute right-2 top-2 z-10 rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] p-1 text-[color:var(--app-text-soft)] transition hover:text-[color:var(--app-text)]"
          aria-label="Close popup"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      {children}
    </div>,
    containerRef.current
  );
}

type MarkerTooltipProps = {
  children: ReactNode;
  className?: string;
} & Omit<PopupOptions, "className" | "closeButton" | "closeOnClick">;

function MarkerTooltip({ children, className, ...popupOptions }: MarkerTooltipProps) {
  const { markerRef, markerElementRef, map, isReady } = useMarkerContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<MapLibreGL.Popup | null>(null);
  const [mounted, setMounted] = useState(false);
  const popupOptionsRef = useRef(popupOptions);

  useEffect(() => {
    if (!isReady || !markerRef.current || !markerElementRef.current || !map) {
      return;
    }

    const container = document.createElement("div");
    containerRef.current = container;

    const popup = new MapLibreGL.Popup({
      offset: 16,
      ...popupOptionsRef.current,
      closeOnClick: true,
      closeButton: false
    })
      .setMaxWidth("none")
      .setDOMContent(container);

    popupRef.current = popup;

    const markerElement = markerElementRef.current;
    const marker = markerRef.current;

    const handleMouseEnter = () => {
      popup.setLngLat(marker.getLngLat()).addTo(map);
    };
    const handleMouseLeave = () => popup.remove();

    markerElement.addEventListener("mouseenter", handleMouseEnter);
    markerElement.addEventListener("mouseleave", handleMouseLeave);
    setMounted(true);

    return () => {
      markerElement.removeEventListener("mouseenter", handleMouseEnter);
      markerElement.removeEventListener("mouseleave", handleMouseLeave);
      popup.remove();
      popupRef.current = null;
      containerRef.current = null;
      setMounted(false);
    };
  }, [isReady, map, markerElementRef, markerRef]);

  useEffect(() => {
    if (!popupRef.current) {
      return;
    }

    const previous = popupOptionsRef.current;

    if (previous.offset !== popupOptions.offset) {
      popupRef.current.setOffset(popupOptions.offset ?? 16);
    }
    if (previous.maxWidth !== popupOptions.maxWidth && popupOptions.maxWidth) {
      popupRef.current.setMaxWidth(popupOptions.maxWidth);
    }

    popupOptionsRef.current = popupOptions;
  }, [popupOptions]);

  if (!mounted || !containerRef.current) {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg-strong)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-text)] shadow-[0_18px_30px_rgba(15,23,42,0.16)]",
        className
      )}
    >
      {children}
    </div>,
    containerRef.current
  );
}

type MarkerLabelProps = {
  children: ReactNode;
  className?: string;
  position?: "top" | "bottom";
};

function MarkerLabel({ children, className, position = "top" }: MarkerLabelProps) {
  const positionClasses = {
    top: "bottom-full mb-1.5",
    bottom: "top-full mt-1.5"
  };

  return (
    <div
      className={cn(
        "absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-white",
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
}

type MapControlsProps = {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showZoom?: boolean;
  showCompass?: boolean;
  showLocate?: boolean;
  showFullscreen?: boolean;
  className?: string;
  onLocate?: (coords: { longitude: number; latitude: number }) => void;
};

const positionClasses = {
  "top-left": "left-3 top-3",
  "top-right": "right-3 top-3",
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3"
};

function ControlGroup({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[color:var(--line)] bg-[color:var(--glass-bg-strong)] shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl [&>button:not(:last-child)]:border-b [&>button:not(:last-child)]:border-[color:var(--line)]">
      {children}
    </div>
  );
}

function ControlButton({
  onClick,
  label,
  children,
  disabled = false
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "flex h-10 w-10 items-center justify-center text-[color:var(--app-text)] transition hover:bg-[color:var(--glass-hover)]",
        disabled ? "cursor-not-allowed opacity-50" : ""
      )}
    >
      {children}
    </button>
  );
}

function CompassButton({ onClick }: { onClick: () => void }) {
  const { map, isLoaded } = useMap();
  const compassRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isLoaded || !map || !compassRef.current) {
      return;
    }

    const compass = compassRef.current;

    const updateRotation = () => {
      const bearing = map.getBearing();
      const pitch = map.getPitch();
      compass.style.transform = `rotateX(${pitch}deg) rotateZ(${-bearing}deg)`;
    };

    map.on("rotate", updateRotation);
    map.on("pitch", updateRotation);
    updateRotation();

    return () => {
      map.off("rotate", updateRotation);
      map.off("pitch", updateRotation);
    };
  }, [isLoaded, map]);

  return (
    <ControlButton onClick={onClick} label="Reset bearing to north">
      <svg
        ref={compassRef}
        viewBox="0 0 24 24"
        className="h-5 w-5 transition-transform duration-200"
        style={{ transformStyle: "preserve-3d" }}
      >
        <path d="M12 2L16 12H12V2Z" className="fill-red-500" />
        <path d="M12 2L8 12H12V2Z" className="fill-red-300" />
        <path d="M12 22L16 12H12V22Z" className="fill-[rgba(255,255,255,0.6)]" />
        <path d="M12 22L8 12H12V22Z" className="fill-[rgba(255,255,255,0.28)]" />
      </svg>
    </ControlButton>
  );
}

function MapControls({
  position = "bottom-right",
  showZoom = true,
  showCompass = false,
  showLocate = false,
  showFullscreen = false,
  className,
  onLocate
}: MapControlsProps) {
  const { map, isLoaded } = useMap();
  const [waitingForLocation, setWaitingForLocation] = useState(false);

  const handleZoomIn = useCallback(() => {
    map?.zoomTo((map.getZoom() ?? 0) + 1, { duration: 300 });
  }, [map]);

  const handleZoomOut = useCallback(() => {
    map?.zoomTo((map.getZoom() ?? 0) - 1, { duration: 300 });
  }, [map]);

  const handleResetBearing = useCallback(() => {
    map?.resetNorthPitch({ duration: 300 });
  }, [map]);

  const handleLocate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

    setWaitingForLocation(true);
    navigator.geolocation.getCurrentPosition(
      (positionResult) => {
        const coords = {
          longitude: positionResult.coords.longitude,
          latitude: positionResult.coords.latitude
        };

        map?.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 14,
          duration: 1500
        });
        onLocate?.(coords);
        setWaitingForLocation(false);
      },
      () => {
        setWaitingForLocation(false);
      }
    );
  }, [map, onLocate]);

  const handleFullscreen = useCallback(() => {
    const container = map?.getContainer();

    if (!container) {
      return;
    }

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
  }, [map]);

  if (!isLoaded) {
    return null;
  }

  return (
    <div className={cn("absolute z-10 flex flex-col gap-2", positionClasses[position], className)}>
      {showZoom ? (
        <ControlGroup>
          <ControlButton onClick={handleZoomIn} label="Zoom in">
            <Plus className="h-4 w-4" />
          </ControlButton>
          <ControlButton onClick={handleZoomOut} label="Zoom out">
            <Minus className="h-4 w-4" />
          </ControlButton>
        </ControlGroup>
      ) : null}
      {showCompass ? (
        <ControlGroup>
          <CompassButton onClick={handleResetBearing} />
        </ControlGroup>
      ) : null}
      {showLocate ? (
        <ControlGroup>
          <ControlButton onClick={handleLocate} label="Find my location" disabled={waitingForLocation}>
            {waitingForLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
          </ControlButton>
        </ControlGroup>
      ) : null}
      {showFullscreen ? (
        <ControlGroup>
          <ControlButton onClick={handleFullscreen} label="Toggle fullscreen">
            <Maximize className="h-4 w-4" />
          </ControlButton>
        </ControlGroup>
      ) : null}
    </div>
  );
}

type MapPopupProps = {
  longitude: number;
  latitude: number;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  closeButton?: boolean;
} & Omit<PopupOptions, "className">;

function MapPopup({
  longitude,
  latitude,
  onClose,
  children,
  className,
  closeButton = false,
  ...popupOptions
}: MapPopupProps) {
  const { map } = useMap();
  const popupRef = useRef<MapLibreGL.Popup | null>(null);
  const popupOptionsRef = useRef(popupOptions);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setContainer(document.createElement("div"));
  }, []);

  useEffect(() => {
    if (!map || !container) {
      return;
    }

    const popup = new MapLibreGL.Popup({
      offset: 16,
      ...popupOptionsRef.current,
      closeButton: false
    })
      .setMaxWidth("none")
      .setDOMContent(container)
      .setLngLat([longitude, latitude])
      .addTo(map);

    const handleClose = () => onClose?.();

    popup.on("close", handleClose);
    popupRef.current = popup;

    return () => {
      popup.off("close", handleClose);
      if (popup.isOpen()) {
        popup.remove();
      }
      popupRef.current = null;
    };
  }, [container, latitude, longitude, map, onClose]);

  useEffect(() => {
    popupRef.current?.setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  useEffect(() => {
    if (!popupRef.current) {
      return;
    }

    const previous = popupOptionsRef.current;

    if (previous.offset !== popupOptions.offset) {
      popupRef.current.setOffset(popupOptions.offset ?? 16);
    }
    if (previous.maxWidth !== popupOptions.maxWidth && popupOptions.maxWidth) {
      popupRef.current.setMaxWidth(popupOptions.maxWidth);
    }

    popupOptionsRef.current = popupOptions;
  }, [popupOptions]);

  if (!container) {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "relative rounded-[22px] border border-[color:var(--line)] bg-[color:var(--app-card-bg)] p-3 text-[color:var(--app-text)] shadow-[0_28px_70px_rgba(15,23,42,0.24)] backdrop-blur-xl",
        className
      )}
    >
      {closeButton ? (
        <button
          type="button"
          onClick={() => {
            popupRef.current?.remove();
            onClose?.();
          }}
          className="absolute right-2 top-2 z-10 rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] p-1 text-[color:var(--app-text-soft)] transition hover:text-[color:var(--app-text)]"
          aria-label="Close popup"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      {children}
    </div>,
    container
  );
}

type MapRouteProps = {
  coordinates: [number, number][];
  color?: string;
  width?: number;
  opacity?: number;
  dashArray?: [number, number];
};

function MapRoute({
  coordinates,
  color = "#5b68ff",
  width = 3,
  opacity = 0.8,
  dashArray
}: MapRouteProps) {
  const { map, isLoaded } = useMap();
  const sourceKey = useId().replace(/:/g, "");
  const sourceId = `route-source-${sourceKey}`;
  const layerId = `route-layer-${sourceKey}`;

  useEffect(() => {
    if (!isLoaded || !map) {
      return;
    }

    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] }
      }
    });

    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": color,
        "line-width": width,
        "line-opacity": opacity,
        ...(dashArray ? { "line-dasharray": dashArray } : {})
      }
    });

    return () => {
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch {
        // ignore teardown collisions during theme/style swaps
      }
    };
  }, [color, dashArray, isLoaded, layerId, map, opacity, sourceId, width]);

  useEffect(() => {
    if (!isLoaded || !map || coordinates.length < 2) {
      return;
    }

    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource | undefined;

    if (source) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates }
      });
    }
  }, [coordinates, isLoaded, map, sourceId]);

  useEffect(() => {
    if (!isLoaded || !map || !map.getLayer(layerId)) {
      return;
    }

    map.setPaintProperty(layerId, "line-color", color);
    map.setPaintProperty(layerId, "line-width", width);
    map.setPaintProperty(layerId, "line-opacity", opacity);

    if (dashArray) {
      map.setPaintProperty(layerId, "line-dasharray", dashArray);
    }
  }, [color, dashArray, isLoaded, layerId, map, opacity, width]);

  return null;
}

export {
  Map,
  MapControls,
  MapMarker,
  MapPopup,
  MapRoute,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  MarkerTooltip,
  useMap
};
