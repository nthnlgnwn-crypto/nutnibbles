/*
 * Ported from design-handoff/map-atlas.html. Two-tier cluster/city zoom, the
 * per-country label offsets, and the COMPACT touch-sizing branch are the
 * prototype's own decisions — kept as-is. Adapted where the prototype's
 * standalone-page assumptions don't hold here: places/topology are fetched
 * (one JSON is the single data source shared with the country index below),
 * IDs are prefixed to live in the site's shared stylesheet, colors resolve
 * from design tokens, a failure state was added, zero-entry countries get no
 * world-tier disc, the box was refit to the real content bounds, single-touch
 * drag is left to the page (§6.1), and the chips (§5) filter both tiers.
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
  // Cluster discs, unlike the city DOT_R above, previously kept their own
  // desktop-relative size at COMPACT (22 vs 15 — bigger, not smaller) even
  // though the frame is far narrower. That's most of why the Japan-area
  // discs read as one overlapping blob and why New Zealand's disc clipped
  // the frame edge. ~73% of desktop, with the hit circle (below, via
  // Math.max) still guaranteeing the 44px touch target regardless (pre-commit fix).
  const DISC_R = COMPACT ? 11 : 15;
  const DISC_HOVER = COMPACT ? 13 : 17;
  const DIMMED_OPACITY = 0.18;

  const VALID_COUNTRIES = [
    "Japan", "Indonesia", "Thailand", "United Kingdom", "South Korea",
    "New Zealand", "Hong Kong", "Switzerland", "France"
  ];
  const VALID_KINDS = ["travel", "food"];

  const W = wrap.clientWidth, H = wrap.clientHeight;
  const svg = d3.select("#atlas-wrap").append("svg").attr("viewBox", `0 0 ${W} ${H}`);
  const gGeo = svg.append("g");
  const gClusters = svg.append("g");
  const gCities = svg.append("g");

  const projection = d3.geoMercator();
  const path = d3.geoPath(projection);
  let clusters = [], zoomBehavior, current = d3.zoomIdentity;

  // Hand-tuned so labels clear their pin at the country-cluster zoom level.
  // Re-checked after the §4.2b #2 box refit — the manual fit spread every
  // cluster much further apart than the old fitExtent() ever actually did
  // (see the fit computation below), so most of these are new values, not
  // reused ones.
  const LBL_DY = {
    Indonesia: 36,
    Japan: 34,
    // New Zealand's cluster sits near the bottom edge of the frame; a
    // downward label collided with the "scroll/drag" hint text.
    "New Zealand": -34,
    Thailand: 58,
    "Hong Kong": -34,
    "South Korea": -54,
    // UK/Switzerland/France are close enough to each other, even at the
    // wider fit, that they need deliberate separation, not just distinct
    // sides of their own pin.
    "United Kingdom": -40,
    Switzerland: -38,
    France: 48
  };

  // City-tier labels around Kansai/Tokyo sit close enough to collide;
  // stagger the ones sharing the default y=4 baseline (§4.2b #8).
  const CITY_LBL_DY = {
    osaka: -10,
    kyoto: 22,
    tokyo: 10,
    "fuji-san": -24
  };

  // At mobile width the frame is much narrower than it is tall, so the fit
  // below is width-bound and the whole world map lands in a shorter band
  // than the 520px frame suggests — discs that were merely close on desktop
  // are now genuinely overlapping. COMPACT's bigger disc/font makes this
  // worse, not better, so the label offsets need more room specifically
  // here, not just a copy of the desktop spread (§4.2c #6).
  const LBL_DY_SCALE = COMPACT ? 1.6 : 1;

  function showError() {
    const loading = document.getElementById("atlas-loading");
    const error = document.getElementById("atlas-error");
    if (loading) loading.hidden = true;
    if (error) error.hidden = false;
  }

  function readInitialFilterState() {
    const params = new URLSearchParams(location.search);
    const kind = params.get("kind");
    const country = params.get("country");
    return {
      kind: VALID_KINDS.indexOf(kind) !== -1 ? kind : "all",
      country: VALID_COUNTRIES.indexOf(country) !== -1 ? country : "all"
    };
  }

  const filterState = readInitialFilterState();

  function syncFilterUrl() {
    const params = new URLSearchParams();
    if (filterState.kind !== "all") params.set("kind", filterState.kind);
    if (filterState.country !== "all") params.set("country", filterState.country);
    const qs = params.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  }

  function matchesFilter(place) {
    // A place matches "Food notes" if it has one or more food notes attached,
    // whatever its own kind — Sapporo is a travel-kind chapter but carries 5
    // food notes and must surface there. "Travel chapters" stays literal:
    // only actual chapters, so a standalone review still drops out (§4.2c #1).
    if (filterState.kind === "food" && !(place.kind === "food" || (place.foodNotes && place.foodNotes > 0))) return false;
    if (filterState.kind === "travel" && place.kind !== "travel") return false;
    if (filterState.country !== "all" && place.country !== filterState.country) return false;
    return true;
  }

  Promise.all([
    d3.json("../assets/data/atlas-places.json"),
    d3.json("../assets/data/countries-110m.json")
  ]).then(([data, topo]) => {
    const loading = document.getElementById("atlas-loading");
    if (loading) loading.remove();

    // The card shows whichever pin/cluster was last selected; applyFilter()
    // reads this to refresh the card's filter-dependent text (declared here,
    // ahead of the first applyFilter() call below, not next to showCity —
    // a `let` referenced before its own declaration line throws).
    let selection = null;

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
      // it exists as city-tier pins only (§4.2, §4.2b #4).
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
    // Refit to the real content bounds — the old box (-14..152) predated New
    // Zealand at 174°E and left the left 40% of the frame empty (§4.2b #2).
    //
    // Not projection.fitExtent() with a GeoJSON polygon: d3-geo's adaptive
    // clipping treats a ring spanning this much of the globe (186° of
    // longitude) as degenerate and silently falls back to whole-sphere
    // bounds, which is why the original box's exact numbers never actually
    // mattered — every fit was really "whole world," just close enough by
    // luck for the original 4-country set. Fit the two corner points by hand.
    const BOX_LON = [-8, 178], BOX_LAT = [-44, 60];
    // The fit only ever accounted for pin *coordinates*, not the disc drawn
    // on top of one — New Zealand's cluster anchor sits close enough to the
    // box's own edge (176°E against a 178°E box) that its disc, radius and
    // all, extended past the frame. Pad by the disc radius plus a modest
    // allowance for a centered label overrunning its pin (pre-commit fix).
    // Desktop's discs never got this close to its own wider padding.
    const COMPACT_DISC_MARGIN = DISC_R + 20;
    const pad = COMPACT
      ? { left: COMPACT_DISC_MARGIN, top: COMPACT_DISC_MARGIN, right: COMPACT_DISC_MARGIN, bottom: COMPACT_DISC_MARGIN }
      : { left: 26, top: 40, right: 26, bottom: 26 };
    projection.scale(1).translate([0, 0]);
    const topLeft = projection([BOX_LON[0], BOX_LAT[1]]);
    const bottomRight = projection([BOX_LON[1], BOX_LAT[0]]);
    const boxW = bottomRight[0] - topLeft[0], boxH = bottomRight[1] - topLeft[1];
    const availW = W - pad.left - pad.right, availH = H - pad.top - pad.bottom;
    const fitScale = Math.min(availW / boxW, availH / boxH);
    const midX = (topLeft[0] + bottomRight[0]) / 2, midY = (topLeft[1] + bottomRight[1]) / 2;
    projection.scale(fitScale).translate([
      (pad.left + W - pad.right) / 2 - fitScale * midX,
      (pad.top + H - pad.bottom) / 2 - fitScale * midY
    ]);

    // non-scaling-stroke: gGeo gets scale(kk) applied on zoom (see render());
    // without it the 1.25px coastline balloons to 1.25*kk at city tier (§4.2c #4).
    gGeo.selectAll("path").data(feats.features).join("path")
      .attr("d", path).attr("fill", "var(--paper-sunken)").attr("stroke", "var(--rule-strong)")
      .attr("stroke-width", 1.25).attr("vector-effect", "non-scaling-stroke");

    places.forEach((p) => { const xy = projection([p.lon, p.lat]); p.px = xy[0]; p.py = xy[1]; });
    clusters.forEach((c) => { const xy = projection([c.lon, c.lat]); c.px = xy[0]; c.py = xy[1]; });

    // ── country clusters ─────────────────────────────
    const cl = gClusters.selectAll("g.pin").data(clusters).join("g").attr("class", "pin")
      .on("click", (e, d) => { if (!clusterMatches(d)) return; zoomTo(d.members, 5.5); showCluster(d); })
      .on("mouseenter", function () { d3.select(this).select("circle.disc").transition().duration(140).attr("r", DISC_HOVER); })
      .on("mouseleave", function () { d3.select(this).select("circle.disc").transition().duration(140).attr("r", DISC_R); });
    cl.append("circle").attr("class", "hit").attr("r", Math.max(DISC_R, 24)).attr("fill", "transparent");
    cl.append("circle").attr("class", "disc").attr("r", DISC_R)
      .attr("fill", (d) => COLORS[d.kind]).attr("stroke", "var(--paper)").attr("stroke-width", 2);
    cl.append("text").attr("class", "cnt").attr("y", COMPACT ? 4 : 5)
      .style("font-size", COMPACT ? "12px" : "15px").text((d) => filteredCount(d));
    cl.append("text").attr("class", "clbl").attr("y", (d) => (LBL_DY[d.name] || 34) * LBL_DY_SCALE).attr("text-anchor", "middle").text((d) => d.name);

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
      .attr("x", (d) => d.lon < 20 ? -(DOT_R + 8) : (DOT_R + 8))
      .attr("y", (d) => CITY_LBL_DY[d.id] !== undefined ? CITY_LBL_DY[d.id] : 4)
      .attr("text-anchor", (d) => d.lon < 20 ? "end" : "start")
      .text((d) => d.kind === "soon" ? d.name + " · soon" : d.name);

    zoomBehavior = d3.zoom().scaleExtent([1, 14])
      .translateExtent([[-W * 0.4, -H * 0.4], [W * 1.4, H * 1.4]])
      // Single-finger touch is left to the page to scroll (§6.1); only
      // multi-touch, mouse and wheel gestures drive the map's own zoom/pan.
      .filter((event) => {
        if (event.type === "touchstart" || event.type === "touchmove") return event.touches.length > 1;
        return (!event.ctrlKey || event.type === "wheel") && !event.button;
      })
      .on("start", () => wrap.classList.add("dragging"))
      .on("end", () => wrap.classList.remove("dragging"))
      .on("zoom", (e) => { current = e.transform; render(); });
    svg.call(zoomBehavior).on("dblclick.zoom", null);

    render();
    // The card is a response to a click, not a default — it starts empty
    // unless a ?country= deep link names a specific selection (§4.2c #3).
    if (filterState.country !== "all") {
      const selected = clusters.find((c) => c.name === filterState.country);
      if (selected) { zoomTo(selected.members, 5.5); showCluster(selected); }
    } else {
      clearCard();
    }
    applyFilter();

    document.getElementById("atlas-zin").onclick = () => svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.9);
    document.getElementById("atlas-zout").onclick = () => svg.transition().duration(300).call(zoomBehavior.scaleBy, 1 / 1.9);
    document.getElementById("atlas-zreset").onclick = () => {
      svg.transition().duration(600).call(zoomBehavior.transform, d3.zoomIdentity);
      clearCard();
    };

    setupFilterControls();

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
      selection = { type: "city", data: d };
      set("City", d.name, d.country + " · " + d.when, d.items);
    }
    function showCluster(c) {
      selection = { type: "cluster", data: c };
      const n = filteredCount(c);
      set("Country", c.name, n + (n === 1 ? " place" : " places") + " · click to zoom in",
        c.members.filter(matchesFilter).map((m) => m.name + (m.kind === "soon" ? " — planned" : " — " + m.when)));
    }
    // The card is a response to a click; before the first one, or once the
    // active filter empties whatever was selected, it holds a prompt instead
    // of a stale or zero-count subject (§4.2c #3).
    function clearCard() {
      selection = null;
      set("", "Select a country", "Click a pin to see what's there.", []);
    }
    function set(kind, title, sub, items) {
      document.querySelector("#atlas-card .atlas-card-kind").textContent = kind;
      document.getElementById("atlas-card-title").textContent = title;
      document.getElementById("atlas-card-sub").textContent = sub;
      document.getElementById("atlas-card-list").innerHTML = items
        .map((t) => `<li><span>&rarr;</span><span style="color:var(--body)">${t}</span></li>`)
        .join("");
    }

    function filteredCount(cluster) {
      return cluster.members.filter(matchesFilter).length;
    }
    function clusterMatches(cluster) {
      return filteredCount(cluster) > 0;
    }

    // ── filters (§5) ──────────────────────────────────
    function applyFilter() {
      // A cluster disc shows the count of entries matching the active filter,
      // and no disc is ever drawn reading 0 — a filtered-out country keeps
      // its dimmed label and loses the disc entirely, the same rule §4.2
      // already applies to countries with zero *written* entries, generalised
      // to "zero *matching*" (§4.2c #2).
      gClusters.selectAll("g.pin").each(function (d) {
        const n = filteredCount(d);
        const hasMatch = n > 0;
        const g = d3.select(this);
        g.select("circle.hit").style("display", hasMatch ? null : "none");
        g.select("circle.disc").style("display", hasMatch ? null : "none");
        g.select("text.cnt").style("display", hasMatch ? null : "none").text(n);
        g.select("text.clbl").style("opacity", hasMatch ? 1 : DIMMED_OPACITY);
      });
      gCities.selectAll("g.pin").each(function (d) {
        const match = matchesFilter(d);
        d3.select(this)
          .style("opacity", match ? 1 : DIMMED_OPACITY)
          .style("pointer-events", match ? null : "none");
      });
      // pointer-events above is layered under render()'s own tier-level toggle;
      // re-run it so the two never fight over which tier is actually live.
      render();

      document.querySelectorAll(".atlas-index-row[data-kind]").forEach((row) => {
        const kind = row.dataset.kind;
        const foodNotes = Number(row.dataset.foodNotes || 0);
        const kindMatches = filterState.kind === "all"
          || (filterState.kind === "food" && (kind === "food" || foodNotes > 0))
          || (filterState.kind === "travel" && kind === "travel");
        const countryMatches = filterState.country === "all" || row.dataset.country === filterState.country;
        row.hidden = !(kindMatches && countryMatches);
      });
      document.querySelectorAll(".atlas-index-country[data-country]").forEach((block) => {
        const rows = block.querySelectorAll(".atlas-index-row");
        const anyVisible = Array.prototype.some.call(rows, (r) => !r.hidden);
        block.hidden = !anyVisible;
      });
      const alsoRoute = document.getElementById("atlas-also-route");
      if (alsoRoute) alsoRoute.hidden = !(filterState.kind === "all" && filterState.country === "all");

      // Refresh or clear the card against the *now-active* filter: a cluster
      // card's count/list is filter-dependent and would otherwise go stale;
      // if the filter has emptied the selected subject entirely, clear the
      // card rather than invite a zoom into (or read of) an empty one (§4.2c #3).
      if (selection) {
        if (selection.type === "cluster") {
          if (filteredCount(selection.data) > 0) showCluster(selection.data);
          else clearCard();
        } else if (selection.type === "city" && !matchesFilter(selection.data)) {
          clearCard();
        }
      }

      updateResultLine();
    }

    function updateResultLine() {
      const matching = places.filter((p) => p.kind !== "soon" && matchesFilter(p));
      const el = document.querySelector(".atlas-result-line");
      if (!el) return;
      const n = matching.length;
      const noun = n === 1 ? " place" : " places";
      if (filterState.country !== "all") {
        el.textContent = n + noun + " in " + filterState.country;
      } else {
        const countrySet = new Set(matching.map((p) => p.country));
        const m = countrySet.size;
        el.textContent = n + noun + " across " + m + (m === 1 ? " country" : " countries");
      }
    }

    function setupFilterControls() {
      const kindButtons = Array.prototype.slice.call(document.querySelectorAll('[data-chip-group="kind"] button'));
      const countryButtons = Array.prototype.slice.call(document.querySelectorAll('[data-chip-group="country"] button'));

      function syncButtons() {
        kindButtons.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.value === filterState.kind)));
        countryButtons.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.value === filterState.country)));
      }

      kindButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          filterState.kind = btn.dataset.value;
          syncButtons();
          syncFilterUrl();
          applyFilter();
        });
      });

      countryButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const value = btn.dataset.value;
          if (filterState.country === value) {
            filterState.country = "all";
          } else {
            filterState.country = value;
            const selected = clusters.find((c) => c.name === value);
            if (selected) { zoomTo(selected.members, 5.5); showCluster(selected); }
          }
          syncButtons();
          syncFilterUrl();
          applyFilter();
        });
      });

      syncButtons();
      syncFilterUrl();
    }
  }).catch(showError);
})();
