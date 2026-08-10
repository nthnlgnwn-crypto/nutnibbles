/*
 * Ported from design-handoff/map-atlas.html. Two-tier cluster/city zoom, the
 * per-country label offsets, and the COMPACT touch-sizing branch are the
 * prototype's own decisions — kept as-is. Adapted only where the prototype's
 * standalone-page assumptions don't hold here: places/topology are fetched
 * (one JSON is the single data source shared with the country index below),
 * IDs are prefixed to live in the site's shared stylesheet, colors resolve
 * from design tokens, and a failure state was added (the prototype had none).
 */
(function () {
  const wrap = document.getElementById("atlas-wrap");
  if (!wrap) return;

  const COLORS = { travel: "var(--ink)", food: "var(--accent)", soon: "var(--rule-strong)" };
  const CITY_ZOOM = 2.4;
  const COMPACT = window.innerWidth <= 520;
  // Touch needs a 44px target: hit areas are transparent circles over the visible dot.
  const DOT_R = COMPACT ? 10 : 5;
  const DOT_HOVER = COMPACT ? 13 : 7.5;
  const HIT_R = COMPACT ? 24 : 16;
  const DISC_R = COMPACT ? 22 : 15;
  const DISC_HOVER = COMPACT ? 25 : 17;

  const W = wrap.clientWidth, H = wrap.clientHeight;
  const svg = d3.select("#atlas-wrap").append("svg").attr("viewBox", `0 0 ${W} ${H}`);
  const gGeo = svg.append("g");
  const gClusters = svg.append("g");
  const gCities = svg.append("g");

  const projection = d3.geoMercator();
  const path = d3.geoPath(projection);
  let clusters = [], zoomBehavior, current = d3.zoomIdentity;

  // Hand-tuned so labels clear their pin at the country-cluster zoom level.
  const LBL_DY = {
    Indonesia: 36,
    Japan: 34,
    "New Zealand": 34,
    Thailand: 58,
    "Hong Kong": -34,
    "South Korea": -54,
    "United Kingdom": -40,
    Switzerland: -38,
    France: 48
  };

  function showError() {
    const loading = document.getElementById("atlas-loading");
    const error = document.getElementById("atlas-error");
    if (loading) loading.hidden = true;
    if (error) error.hidden = false;
  }

  Promise.all([
    d3.json("../assets/data/atlas-places.json"),
    d3.json("../assets/data/countries-110m.json")
  ]).then(([data, topo]) => {
    const loading = document.getElementById("atlas-loading");
    if (loading) loading.remove();

    const legend = document.getElementById("atlas-legend");
    const zoomEl = document.getElementById("atlas-zoom");
    const card = document.getElementById("atlas-card");
    const hint = document.getElementById("atlas-hint");
    [legend, zoomEl, card, hint].forEach((el) => { if (el) el.hidden = false; });

    const places = data.places;
    const countryOrder = data.countryOrder;

    countryOrder.forEach((c) => {
      const members = places.filter((p) => p.country === c);
      const live = members.filter((p) => p.kind !== "soon");
      // A country with zero written entries gets no world-tier disc at all —
      // it exists as city-tier pins only.
      if (live.length === 0) return;
      clusters.push({
        name: c,
        lat: d3.mean(members, (p) => p.lat),
        lon: d3.mean(members, (p) => p.lon),
        count: live.length,
        kind: live.every((p) => p.kind === "food") ? "food" : "travel",
        members
      });
    });

    const feats = topojson.feature(topo, topo.objects.countries);
    const box = { type: "Polygon", coordinates: [[[-14, -14], [152, -14], [152, 62], [-14, 62], [-14, -14]]] };
    projection.fitExtent([[26, 40], [W - 26, H - 26]], box);

    gGeo.selectAll("path").data(feats.features).join("path")
      .attr("d", path).attr("fill", "var(--paper-sunken)").attr("stroke", "var(--paper)").attr("stroke-width", 1);

    places.forEach((p) => { const xy = projection([p.lon, p.lat]); p.px = xy[0]; p.py = xy[1]; });
    clusters.forEach((c) => { const xy = projection([c.lon, c.lat]); c.px = xy[0]; c.py = xy[1]; });

    // ── country clusters ─────────────────────────────
    const cl = gClusters.selectAll("g.pin").data(clusters).join("g").attr("class", "pin")
      .on("click", (e, d) => { zoomTo(d.members, 5.5); showCluster(d); })
      .on("mouseenter", function () { d3.select(this).select("circle.disc").transition().duration(140).attr("r", DISC_HOVER); })
      .on("mouseleave", function () { d3.select(this).select("circle.disc").transition().duration(140).attr("r", DISC_R); });
    cl.append("circle").attr("class", "hit").attr("r", Math.max(DISC_R, 24)).attr("fill", "transparent");
    cl.append("circle").attr("class", "disc").attr("r", DISC_R)
      .attr("fill", (d) => COLORS[d.kind]).attr("stroke", "var(--paper)").attr("stroke-width", 2);
    cl.append("text").attr("class", "cnt").attr("y", COMPACT ? 7 : 5)
      .style("font-size", COMPACT ? "20px" : "15px").text((d) => d.count);
    cl.append("text").attr("class", "clbl").attr("y", (d) => LBL_DY[d.name] || 34).attr("text-anchor", "middle").text((d) => d.name);

    // ── city pins ───────────────────────────────────
    const ct = gCities.selectAll("g.pin").data(places).join("g").attr("class", "pin")
      .on("click", (e, d) => showCity(d))
      .on("mouseenter", function () { d3.select(this).select("circle.dot").transition().duration(140).attr("r", DOT_HOVER); })
      .on("mouseleave", function () { d3.select(this).select("circle.dot").transition().duration(140).attr("r", DOT_R); });
    ct.append("circle").attr("class", "hit").attr("r", HIT_R).attr("fill", "transparent");
    ct.append("circle").attr("class", "halo").attr("r", COMPACT ? 20 : 14)
      .attr("fill", (d) => d.kind === "food" ? "rgba(176, 69, 28, .13)" : d.kind === "soon" ? "rgba(122, 114, 100, .10)" : "rgba(25, 23, 19, .09)");
    ct.append("circle").attr("class", "dot").attr("r", DOT_R)
      .attr("fill", (d) => COLORS[d.kind]).attr("stroke", "var(--paper)").attr("stroke-width", COMPACT ? 2 : 1.5);
    ct.append("text").attr("class", "lbl")
      .attr("x", (d) => d.lon < 20 ? -(DOT_R + 8) : (DOT_R + 8)).attr("y", 4)
      .attr("text-anchor", (d) => d.lon < 20 ? "end" : "start")
      .text((d) => d.kind === "soon" ? d.name + " · soon" : d.name);

    zoomBehavior = d3.zoom().scaleExtent([1, 14])
      .translateExtent([[-W * 0.4, -H * 0.4], [W * 1.4, H * 1.4]])
      .on("start", () => wrap.classList.add("dragging"))
      .on("end", () => wrap.classList.remove("dragging"))
      .on("zoom", (e) => { current = e.transform; render(); });
    svg.call(zoomBehavior).on("dblclick.zoom", null);

    render();
    showCluster(clusters[0]);

    document.getElementById("atlas-zin").onclick = () => svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.9);
    document.getElementById("atlas-zout").onclick = () => svg.transition().duration(300).call(zoomBehavior.scaleBy, 1 / 1.9);
    document.getElementById("atlas-zreset").onclick = () => {
      svg.transition().duration(600).call(zoomBehavior.transform, d3.zoomIdentity);
      showCluster(clusters[0]);
    };

    function render() {
      const t = current;
      gGeo.attr("transform", t);
      const cityMode = t.k >= CITY_ZOOM;
      gClusters.style("opacity", cityMode ? 0 : 1).style("pointer-events", cityMode ? "none" : "all");
      gCities.style("opacity", cityMode ? 1 : 0).style("pointer-events", cityMode ? "all" : "none");
      gClusters.selectAll("g.pin").attr("transform", (d) => `translate(${t.applyX(d.px)},${t.applyY(d.py)})`);
      gCities.selectAll("g.pin").attr("transform", (d) => `translate(${t.applyX(d.px)},${t.applyY(d.py)})`);
    }

    function zoomTo(members, k) {
      const xs = members.map((m) => m.px), ys = members.map((m) => m.py);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const spanX = Math.max(...xs) - Math.min(...xs), spanY = Math.max(...ys) - Math.min(...ys);
      const fit = Math.min((W - 220) / Math.max(spanX, 1), (H - 200) / Math.max(spanY, 1));
      const kk = Math.max(CITY_ZOOM + 0.4, Math.min(k, isFinite(fit) ? fit : k, 9));
      svg.transition().duration(700).call(
        zoomBehavior.transform,
        d3.zoomIdentity.translate(W / 2 - kk * cx, H / 2 - kk * cy).scale(kk)
      );
    }

    function showCity(d) {
      set("City", d.name, d.country + " · " + d.when, d.items);
    }
    function showCluster(c) {
      set("Country", c.name, c.count + (c.count === 1 ? " place" : " places") + " · click to zoom in",
        c.members.map((m) => m.name + (m.kind === "soon" ? " — planned" : " — " + m.when)));
    }
    function set(kind, title, sub, items) {
      document.querySelector("#atlas-card .atlas-card-kind").textContent = kind;
      document.getElementById("atlas-card-title").textContent = title;
      document.getElementById("atlas-card-sub").textContent = sub;
      document.getElementById("atlas-card-list").innerHTML = items
        .map((t) => `<li><span>&rarr;</span><span style="color:var(--body)">${t}</span></li>`)
        .join("");
    }
  }).catch(showError);
})();
