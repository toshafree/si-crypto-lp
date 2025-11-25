// bubbles.js

// ==== HERO BUBBLES ====
document.addEventListener('DOMContentLoaded', () => {
  const svgHero = d3.select("#bubbleChart");
  const bubbleContainer = document.querySelector(".bubble-stage");
  if (!bubbleContainer) return;

  const widthHero = bubbleContainer.clientWidth;
  const heightHero = bubbleContainer.clientHeight;

  const heroLoaderEl = bubbleContainer.querySelector(".hero-loader");

  function setHeroLoading(isLoading) {
    if (heroLoaderEl) {
      heroLoaderEl.classList.toggle("visible", isLoading);
    }
    svgHero.style("opacity", isLoading ? 0 : 1);
  }

  svgHero.attr("width", widthHero).attr("height", heightHero);

  const SIZE_K = 0.40;
  const DRIFT_MAX = 0.16;
  const DRIFT_CHANGE_MS = 7000;

  const DATA_URL = "https://script.google.com/macros/s/AKfycbzVXCW9daPqP4Cmnq9WdCGMUyJ1Oy7KX9O5raf6YcJJ9LyVi-ofDBr8f6VItXhI51Vx6A/exec";
  const FETCH_INTERVAL_MS = 6000_000; // как в исходнике

  const fallbackRawData = [
    { id: "be5a7773-d763-4dae-aba2-6d611b7133e9", ticker: "USTCUSDT", exchange1: "Gate",    exchange2: "Mexc",   diff: 0.025 },
    { id: "9ef9d78a-1630-4b2c-ba1e-027fb53911bc", ticker: "AIXBTUSDT", exchange1: "BitGet",  exchange2: "Mexc",   diff: 0.024 },
    { id: "7105cdf7-d7e1-420b-8fba-ea5a756d1454", ticker: "RESOLVUSDT", exchange1: "Binance", exchange2: "ByBit", diff: 0.024 },
    { id: "be5a7773-d763-4dae-aba2-6d611b7133e9", ticker: "USTCUSDT",   exchange1: "Gate",    exchange2: "Mexc",   diff: 0.025 },
    { id: "dec0bbf4-f5b1-4d42-92ad-824ef20908b5", ticker: "CORLUSDT",   exchange1: "Gate",    exchange2: "Mexc",   diff: 0.022 },
    { id: "a0f83214-c561-4694-a893-ea0bb81baf26", ticker: "ALLUSDT",    exchange1: "Gate",    exchange2: "Binance",diff: 0.068 },
    { id: "3145e69a-bf8b-4d5e-94d9-e0b85858b30b", ticker: "GIGGLEUSDT", exchange1: "Binance", exchange2: "BitGet",diff: 0.042 },
    { id: "d546e957-78b5-46d7-bb21-8d6e0b376de7", ticker: "KITEUSDT",   exchange1: "Binance", exchange2: "Mexc",   diff: 0.035 },
    { id: "e4d628da-8e36-4f54-9377-87df0a363db9", ticker: "FUSDT",      exchange1: "Binance", exchange2: "Mexc",   diff: 0.026 }
  ];

  let rawData = fallbackRawData.slice();

  const defsHero = svgHero.append("defs");
  const gradsGroupHero = defsHero.append("g").attr("id", "bubbleGradients");

  defsHero.append("clipPath")
    .attr("id", "icon-clip")
    .attr("clipPathUnits", "objectBoundingBox")
    .append("circle")
    .attr("cx", 0.5)
    .attr("cy", 0.5)
    .attr("r", 0.5);

  let nodesHero = [];
  let simulationHero = null;

  function normalizeExchange(name) {
    return (name || "").trim().toLowerCase();
  }

  function hashColor(symbol) {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = (hash * 31 + symbol.charCodeAt(i)) & 0xffffffff;
    }
    const r = (hash & 0xff);
    const g = (hash >> 8) & 0xff;
    const b = (hash >> 16) & 0xff;
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }

  function updateGradientsHero(nodes) {
    const grad = gradsGroupHero
      .selectAll("radialGradient")
      .data(nodes, d => d.id)
      .join(
        enter => enter.append("radialGradient")
          .attr("id", d => `grad-${d.id}`)
          .attr("cx", "50%")
          .attr("cy", "50%")
          .attr("r", "50%"),
        update => update
      );

    grad.each(function(d) {
      const g = d3.select(this);
      g.selectAll("stop").remove();

      g.append("stop").attr("offset", "0%").attr("stop-color", d.color).attr("stop-opacity", 0);
      g.append("stop").attr("offset", "40%").attr("stop-color", d.color).attr("stop-opacity", 0);
      g.append("stop").attr("offset", "85%").attr("stop-color", d.color).attr("stop-opacity", 0.15);
      g.append("stop").attr("offset", "100%").attr("stop-color", d.color).attr("stop-opacity", 0.85);
    });
  }

  function createOrUpdateSimulationHero() {
    const nodeSel = svgHero
      .selectAll("g.bubble-node")
      .data(nodesHero, d => d.id);

    const nodeEnter = nodeSel.enter()
      .append("g")
      .attr("class", "bubble-node")
      .style("cursor", "pointer")
      .attr("opacity", 0);

    nodeEnter.append("circle");
    nodeEnter.append("text").attr("class", "diff-text");
    nodeEnter.append("text").attr("class", "symbol-text");
    nodeEnter.append("g").attr("class", "icons-group");

    nodeEnter.transition().duration(600).attr("opacity", 1);

    nodeSel.exit().transition().duration(400).attr("opacity", 0).remove();

    const nodeMerge = nodeEnter.merge(nodeSel);

    nodeMerge.select("circle")
      .attr("r", d => d.r)
      .attr("fill", d => `url(#grad-${d.id})`)
      .attr("stroke", d => d.color)
      .attr("stroke-width", 2);

    nodeMerge.select("text.diff-text")
      .text(d => `${(Math.abs(d.diff) * 100).toFixed(1)}%`)
      .attr("font-size", d => d.r * SIZE_K)
      .attr("dy", d => -0.25 * d.r);

    nodeMerge.select("text.symbol-text")
      .text(d => d.symbol)
      .attr("font-size", d => d.r * SIZE_K * 0.65)
      .attr("dy", d => 0.02 * d.r);

    nodeMerge.select("g.icons-group")
      .attr("transform", d => `translate(0, ${0.32 * d.r})`)
      .each(function(d) {
        const g = d3.select(this);
        g.selectAll("*").remove();

        const iconSize = d.r * SIZE_K * 0.9;
        const spacing = iconSize + 4;
        const mics = d.mics.slice(0, 2);

        mics.forEach((mic, idx) => {
          const x = idx === 0 ? -spacing / 2 : spacing / 2;

          const image = g.append("image")
            .attr("x", x - iconSize / 2)
            .attr("y", -iconSize / 2)
            .attr("width", iconSize)
            .attr("height", iconSize)
            .attr("href", `img/${mic}_icon.png`)
            .attr("clip-path", "url(#icon-clip)");

          image.on("error", function() {
            d3.select(this).remove();
            const fo = g.append("foreignObject")
              .attr("x", x - iconSize / 2)
              .attr("y", -iconSize / 2)
              .attr("width", iconSize)
              .attr("height", iconSize);

            fo.append("xhtml:div")
              .attr("class", "icon-fallback")
              .style("border-radius", "999px")
              .style("font-size", `${iconSize * 0.45}px`)
              .style("display", "flex")
              .style("align-items", "center")
              .style("justify-content", "center")
              .style("background", "rgba(15,23,42,0.9)")
              .style("border", "1px solid rgba(148,163,184,0.5)")
              .style("color", "#e5e7eb")
              .text((mic || "?").slice(0, 2).toUpperCase());
          });
        });
      });

    const allNodes = nodeMerge;

    // Увеличение пузыря на 5% при наведении
    allNodes
      .on("mouseenter.enlarge", function (event, d) {
        d._orig_r = d.r;
        d.r = d.r * 1.05;
        d3.select(this).select("circle")
          .transition().duration(120)
          .attr("r", d.r);
      })
      .on("mouseleave.enlarge", function (event, d) {
        if (d._orig_r) d.r = d._orig_r;
        d3.select(this).select("circle")
          .transition().duration(120)
          .attr("r", d.r);
      });

    allNodes.on("click", function(event, d) {
      const url = `https://spread-i.online/cryptoscreener/${d.pairId}`;
      ym(105484818,'reachGoal','balloon-click');
      window.open(url, "_blank");
    });

    if (!simulationHero) {
      simulationHero = d3.forceSimulation(nodesHero)
        .alpha(0.6)
        .alphaDecay(0)
        .force("center", d3.forceCenter(widthHero / 2, heightHero / 2))
        .force("collide", d3.forceCollide(d => d.r + 6).strength(0.9).iterations(3))
        .force("x", d3.forceX(widthHero / 2).strength(0.02))
        .force("y", d3.forceY(heightHero / 2).strength(0.02))
        .velocityDecay(0.25)
        .on("tick", tickedHero);
    } else {
      simulationHero.nodes(nodesHero);
      simulationHero.alpha(0.6);
      simulationHero.alphaDecay(0);
      simulationHero.restart();
    }

    function tickedHero() {
      nodesHero.forEach(d => {
        if (Number.isFinite(d.dvx) && Number.isFinite(d.dvy)) {
          d.x += d.dvx;
          d.y += d.dvy;
        }

        const margin = 2;
        const minX = d.r + margin;
        const maxX = widthHero - d.r - margin;
        const minY = d.r + margin;
        const maxY = heightHero - d.r - margin;

        if (d.x < minX) { d.x = minX; d.vx *= -0.5; d.dvx = Math.abs(d.dvx); }
        if (d.x > maxX) { d.x = maxX; d.vx *= -0.5; d.dvx = -Math.abs(d.dvx); }
        if (d.y < minY) { d.y = minY; d.vy *= -0.5; d.dvy = Math.abs(d.dvy); }
        if (d.y > maxY) { d.y = maxY; d.vy *= -0.5; d.dvy = -Math.abs(d.dvy); }
      });

      svgHero.selectAll("g.bubble-node")
        .attr("transform", d => `translate(${d.x},${d.y})`);
    }
  }

  function randomizeDriftHero() {
    nodesHero.forEach(d => {
      const angle = Math.random() * 2 * Math.PI;
      const speed = DRIFT_MAX * (0.4 + 0.6 * Math.random());
      d.dvx = Math.cos(angle) * speed;
      d.dvy = Math.sin(angle) * speed;
    });
    if (simulationHero) {
      simulationHero.alpha(0.4).restart();
    }
  }

  function initHeroBubbles() {
    const pairs = rawData;
    const maxAbsDiff = d3.max(pairs, d => Math.abs(d.diff)) || 1;

    const rScale = d3.scaleLinear()
      .domain([0, maxAbsDiff])
      .range([24, 52]);

    nodesHero = pairs.map((p, idx) => ({
      id: `node-${idx}`,
      pairId: p.id,
      symbol: p.ticker,
      mics: [
        normalizeExchange(p.exchange1),
        normalizeExchange(p.exchange2)
      ],
      diff: p.diff,
      color: hashColor(p.ticker),
      r: rScale(Math.abs(p.diff)),
      x: widthHero / 2 + (Math.random() - 0.5) * 40,
      y: heightHero / 2 + (Math.random() - 0.5) * 40,
      dvx: 0,
      dvy: 0
    }));

    randomizeDriftHero();
    updateGradientsHero(nodesHero);
    createOrUpdateSimulationHero();
  }

  async function reloadHeroBubblesFromRemote(useFallbackOnError = true) {
    setHeroLoading(true);
    try {
      const resp = await fetch(DATA_URL, { cache: "no-store" });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const json = await resp.json();

      const parsed = (Array.isArray(json) ? json : []).map((row, idx) => {
        const diffVal = typeof row.diff === "string" ? parseFloat(row.diff) : row.diff;

        return {
          id: row.id ?? `remote-${idx}`,
          ticker: row.ticker ?? row.symbol ?? "",
          exchange1: row.exchange1 ?? row.ex1 ?? row.exchange_1 ?? "",
          exchange2: row.exchange2 ?? row.ex2 ?? row.exchange_2 ?? "",
          diff: Number.isFinite(diffVal) ? diffVal : 0
        };
      }).filter(d => d.ticker && Number.isFinite(d.diff));

      if (!parsed.length) {
        throw new Error("empty or invalid data");
      }

      rawData = parsed;
      initHeroBubbles();
    } catch (err) {
      console.error("Failed to reload hero bubbles from remote:", err);
      if (useFallbackOnError) {
        rawData = fallbackRawData.slice();
        initHeroBubbles();
      }
    } finally {
      setHeroLoading(false);
    }
  }

  reloadHeroBubblesFromRemote(true);

  // раз в минуту обновляем данные пузырей
  setInterval(() => {
    reloadHeroBubblesFromRemote(false);
  }, FETCH_INTERVAL_MS);

  // постоянное медленное дрейфовое движение
  setInterval(randomizeDriftHero, DRIFT_CHANGE_MS);
});
