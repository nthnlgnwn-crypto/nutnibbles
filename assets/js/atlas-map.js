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

  // Base label offsets (LBL_DY, CITY_LBL_DY) and the projection/zoom math
  // now live in atlas-geometry.js, shared with scripts/check-atlas-labels.js
  // so the map and its collision check can never silently drift apart. A
  // greedy nudge pass (also shared) runs once at load, on top of these base
  // offsets, to clear whatever collides — see the nudge precompute below.
  const geo = window.AtlasGeometry;

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
    // luck for the original 4-country set. Fit the two corner points by hand
    // (atlas-geometry.js's fitProjection — box, padding, and the COMPACT
    // disc-margin allowance all live there now, shared with the check).
    const fit = geo.fitProjection(W, H, COMPACT, DISC_R);
    projection.scale(fit.scale).translate([fit.tx, fit.ty]);

    // non-scaling-stroke: gGeo gets scale(kk) applied on zoom (see render());
    // without it the 1.25px coastline balloons to 1.25*kk at city tier (§4.2c #4).
    gGeo.selectAll("path").data(feats.features).join("path")
      .attr("d", path).attr("fill", "var(--paper-sunken)").attr("stroke", "var(--rule-strong)")
      .attr("stroke-width", 1.25).attr("vector-effect", "non-scaling-stroke");

    places.forEach((p) => { const xy = projection([p.lon, p.lat]); p.px = xy[0]; p.py = xy[1]; });
    clusters.forEach((c) => { const xy = projection([c.lon, c.lat]); c.px = xy[0]; c.py = xy[1]; });

    // Real position of the zoom-control stack, in the same [0,W]x[0,H] frame
    // as every other label computation — measured live rather than assumed,
    // so this can't drift from its own CSS the way a hardcoded guess could.
    // Safe to measure here: zoomEl.hidden was cleared above, so it's laid out.
    const zoomElRect = zoomEl.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const zoomBox = {
      left: zoomElRect.left - wrapRect.left, top: zoomElRect.top - wrapRect.top,
      right: zoomElRect.right - wrapRect.left, bottom: zoomElRect.bottom - wrapRect.top
    };

    // Automated label declutter (Phase 8 #2): each label's base position is
    // its base offset (LBL_DY/CITY_LBL_DY, atlas-geometry.js) plus a greedy
    // vertical nudge that pushes anything still overlapping straight down
    // until clear. Computed once, here — the geometry is static per page
    // load (only the zoom *transform* animates, via translate, and every
    // label's own y rides along with it unchanged), so there's nothing to
    // recompute on pan/zoom and nothing to fight the transform.
    // scripts/check-atlas-labels.js runs this exact same pass in Node and
    // blocks the build if anything still overlaps.
    //
    // Frame/control clipping (Phase 8 #3) is different: whichever country is
    // zoomed in, every place is visible as a bystander, so a bystander's
    // clear-of-the-frame anchor side and position depend on *which* zoom is
    // active, not just its own country's. That part is recomputed on each
    // zoomTo() call (updateCityLabelPositions, below) — still not per
    // animation frame, just once per zoom target, same as the info card.
    const clusterBoxes = clusters.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => {
      const dy = geo.clusterBaseDy(c.name, COMPACT);
      const w = geo.labelWidth(c.name, "cluster");
      const off = geo.labelVerticalOffsets("cluster");
      const y = c.py + dy;
      return { key: c.name, dy, rect: { left: c.px - w / 2, right: c.px + w / 2, top: y + off.top, bottom: y + off.bottom } };
    });
    const clusterX = new Map(), clusterY = new Map();
    geo.nudgeClear(clusterBoxes, geo.NUDGE_STEP_CLUSTER, geo.NUDGE_MAX_STEPS).forEach((b) => {
      const clamped = geo.clampToFrameAndControls(b.rect, W, H, zoomBox, geo.CLAMP_PUSH_GAP, geo.NUDGE_MAX_STEPS);
      clusterX.set(b.key, clamped.left - b.rect.left);
      clusterY.set(b.key, b.dy + (clamped.top - b.rect.top));
    });

    const cityNudgeDy = new Map();
    countryOrder.forEach((name) => {
      const members = places.filter((p) => p.country === name);
      if (members.length < 2) {
        members.forEach((m) => cityNudgeDy.set(m.id, geo.cityBaseDy(m.id)));
        return;
      }
      const zoom = geo.zoomToScale(W, H, members, 5.5);
      const tx = W / 2 - zoom.kk * zoom.cx, ty = H / 2 - zoom.kk * zoom.cy;
      const boxes = members.slice().sort((a, b) => a.id.localeCompare(b.id)).map((d) => {
        const screenX = tx + zoom.kk * d.px, screenY = ty + zoom.kk * d.py;
        const dy = geo.cityBaseDy(d.id);
        return { key: d.id, dy, rect: geo.cityLabelRect(d, screenX, screenY, dy, DOT_R, W).rect };
      });
      geo.nudgeClear(boxes, geo.NUDGE_STEP_CITY, geo.NUDGE_MAX_STEPS).forEach((b) => cityNudgeDy.set(b.key, b.dy));
    });

    // Reactive part of Phase 8 #3: given the country about to be zoomed
    // into, every place's label gets the anchor side and frame/control clamp
    // that fit *this* view, using each place's own (static) dy from above.
    function updateCityLabelPositions(targetMembers) {
      const zoom = geo.zoomToScale(W, H, targetMembers, 5.5);
      const tx = W / 2 - zoom.kk * zoom.cx, ty = H / 2 - zoom.kk * zoom.cy;
      gCities.selectAll("g.pin").each(function (d) {
        const screenX = tx + zoom.kk * d.px, screenY = ty + zoom.kk * d.py;
        const dy = cityNudgeDy.get(d.id);
        const placed = geo.cityLabelRect(d, screenX, screenY, dy, DOT_R, W);
        const clamped = geo.clampToFrameAndControls(placed.rect, W, H, zoomBox, geo.CLAMP_PUSH_GAP, geo.NUDGE_MAX_STEPS);
        const dx = clamped.left - placed.rect.left, dyAdjust = clamped.top - placed.rect.top;
        const label = d3.select(this).select("text.lbl");
        label
          .attr("text-anchor", placed.anchorEnd ? "end" : "start")
          .attr("x", placed.xOff + dx)
          .attr("y", dy + dyAdjust);
      });
    }

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
    cl.append("text").attr("class", "clbl")
      .attr("x", (d) => clusterX.get(d.name)).attr("y", (d) => clusterY.get(d.name))
      .attr("text-anchor", "middle").text((d) => d.name);

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
      // x/text-anchor are set reactively by updateCityLabelPositions() below,
      // since a bystander place's clear side depends on which country is
      // currently zoomed in — city tier isn't visible until the first
      // zoomTo() call sets them, so no placeholder value is ever seen.
      .attr("y", (d) => cityNudgeDy.get(d.id))
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
      const { kk, cx, cy } = geo.zoomToScale(W, H, members, k);
      updateCityLabelPositions(members);
      svg.transition().duration(700).call(
        zoomBehavior.transform,
        d3.zoomIdentity.translate(W / 2 - kk * cx, H / 2 - kk * cy).scale(kk)
      );
    }

    // "Chapter" only fits travel places; the three food-kind pins are
    // reviews, and the site's own vocabulary calls them that everywhere else.
    function actionLabelFor(d) {
      return d.kind === "food" ? `Open the ${d.name} review →` : `Open the ${d.name} chapter →`;
    }

    function showCity(d) {
      selection = { type: "city", data: d };
      const href = d.href ? "../" + d.href : null;
      set("City", d.name, d.country + " · " + d.when, d.items, href,
        href ? { href, label: actionLabelFor(d) } : null);
    }
    function showCluster(c) {
      selection = { type: "cluster", data: c };
      const n = filteredCount(c);
      set("Country", c.name, n + (n === 1 ? " place" : " places") + " · click to zoom in",
        c.members.filter(matchesFilter).map((m) => ({
          text: m.name + (m.kind === "soon" ? " — planned" : " — " + m.when),
          href: m.href ? "../" + m.href : null
        // A cluster has no single destination of its own — no action line.
        })), null, null);
    }
    // The card is a response to a click; before the first one, or once the
    // active filter empties whatever was selected, it holds a prompt instead
    // of a stale or zero-count subject (§4.2c #3).
    function clearCard() {
      selection = null;
      set("", "Select a country", "Click a pin to see what's there.", [], null, null);
    }
    function set(kind, title, sub, items, titleHref, action) {
      document.querySelector("#atlas-card .atlas-card-kind").textContent = kind;
      const titleEl = document.getElementById("atlas-card-title");
      titleEl.innerHTML = titleHref
        ? `<a class="atlas-card-link" href="${titleHref}">${title}</a>`
        : title;
      document.getElementById("atlas-card-sub").textContent = sub;
      document.getElementById("atlas-card-list").innerHTML = items
        .map((item) => {
          const text = typeof item === "string" ? item : item.text;
          const href = typeof item === "string" ? null : item.href;
          return href
            ? `<li><span>&rarr;</span><a class="atlas-card-item-link" href="${href}">${text}</a></li>`
            : `<li><span>&rarr;</span><span style="color:var(--body)">${text}</span></li>`;
        })
        .join("");
      const actionEl = document.getElementById("atlas-card-action");
      if (action) {
        actionEl.href = action.href;
        actionEl.textContent = action.label;
        actionEl.hidden = false;
      } else {
        actionEl.hidden = true;
        actionEl.removeAttribute("href");
      }
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
