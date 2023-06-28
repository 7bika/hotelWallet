/* eslint-disable */
import mapboxgl from "mapbox-gl"

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiN2Jpa2EiLCJhIjoiY2xqOHptNzA1MDlyMTNycGdxM3dpcW9meiJ9.JKumPpcCScbTdDvA9vpo1g"

  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/7bika/clj8zxd4l002901qx347fg0ft",
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    zoom: 10,
    // interactive: false
  })

  const bounds = new mapboxgl.LngLatBounds()

  locations.forEach((loc) => {
    // * Create marker
    const el = document.createElement("div")
    el.className = "marker"

    // * Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat(loc.coordinates)
      .addTo(map)

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map)

    // * Extend map bounds to include current location
    bounds.extend(loc.coordinates)
  })

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  })
}
