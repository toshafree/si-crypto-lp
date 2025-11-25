// deals-slider.js

// ==== EXPERIENCE SLIDER (arbDeals + спред-графики) ====
document.addEventListener('DOMContentLoaded', () => {
  function formatDateTimeISO(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    const mm = pad(d.getUTCMonth() + 1);
    const dd = pad(d.getUTCDate());
    const hh = pad(d.getUTCHours());
    const mi = pad(d.getUTCMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
  }

  function durationMinutes(durationSecondsStr) {
    const sec = Number(durationSecondsStr);
    if (!Number.isFinite(sec)) return "";
    return sec;
  }

  function parseNumberMaybe(str) {
    if (str == null) return null;
    const cleaned = String(str).replace(/,/g, "").replace("%", "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function formatMoney(val, decimals = 0) {
    const n = parseNumberMaybe(val);
    if (n == null) return "";
    return n.toFixed(decimals);
  }

  function formatMoneyWithMinus(val, decimals = 2) {
    let n = parseNumberMaybe(val);
    if (n == null) return "";
    if (n > 0) n = -n;
    return n.toFixed(decimals);
  }

  function formatPrice6(val) {
    const n = parseNumberMaybe(val);
    if (n == null) return "";
    return n.toFixed(6);
  }

  function findClosestCandle(candles, targetSec) {
    if (!candles || !candles.length) return null;
    let best = null;
    let bestDiff = Infinity;
    for (const c of candles) {
      const t = typeof c.time === "number" ? c.time : Number(c.time);
      if (!Number.isFinite(t)) continue;
      const diff = Math.abs(t - targetSec);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = c;
      }
    }
    return best;
  }

  function buildMarkers(spreadCandles, deal) {
    if (!spreadCandles || !spreadCandles.length) return [];

    const openIso = deal.open_datetime;
    const closeIso = deal.close_datetime;
    if (!openIso || !closeIso) return [];

    const openSec = Math.floor(new Date(openIso).getTime() / 1000);
    const closeSec = Math.floor(new Date(closeIso).getTime() / 1000);

    const entryCandle = findClosestCandle(spreadCandles, openSec);
    const exitCandle = findClosestCandle(spreadCandles, closeSec);

    const markers = [];
    if (!entryCandle) return markers;

    const closeEntry = parseNumberMaybe(entryCandle.close);
    if (closeEntry == null) return markers;

    const deviation = closeEntry - 1.0;
    const entryArrowDown = deviation > 0;

    const COLOR_ARROW = "#e879f9";

    const entryShape = entryArrowDown ? "arrowDown" : "arrowUp";
    const entryPosition = entryShape === "arrowUp" ? "belowBar" : "aboveBar";

    const entryMarker = {
      time: entryCandle.time,
      position: entryPosition,
      shape: entryShape,
      color: COLOR_ARROW,
      text: "вход",
      size: 2,
    };
    markers.push(entryMarker);

    if (exitCandle) {
      const exitShape = entryArrowDown ? "arrowUp" : "arrowDown";
      const exitPosition = exitShape === "arrowUp" ? "belowBar" : "aboveBar";

      const exitMarker = {
        time: exitCandle.time,
        position: exitPosition,
        shape: exitShape,
        color: COLOR_ARROW,
        text: "выход",
        size: 2,
      };
      markers.push(exitMarker);
    }

    return markers;
  }

  const slidesWrapper = document.getElementById("slidesWrapper");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const slideIndexLabel = document.getElementById("slideIndex");
  const tabsContainer = document.getElementById("tabsContainer");

  if (!slidesWrapper || !prevBtn || !nextBtn || !slideIndexLabel || !tabsContainer) {
    return;
  }

  const slideItems = [];
  const tabButtons = [];

  (window.arbDeals || []).forEach((deal) => {
    const roiStr = deal.ROI != null ? String(deal.ROI) : "";

    const tabBtn = document.createElement("button");
    tabBtn.className = "tab-btn";
    tabBtn.textContent = `${deal.symbol || ""} ${roiStr}`;
    tabsContainer.appendChild(tabBtn);

    const slide = document.createElement("div");
    slide.className = "slide";

    const left = document.createElement("div");
    left.className = "slide-left";

    const right = document.createElement("div");
    right.className = "slide-right";

    const header = document.createElement("div");
    header.className = "deal-header";

    const symbolEl = document.createElement("h2");
    symbolEl.className = "deal-symbol";
    symbolEl.textContent = deal.symbol || "";

    const roiBlock = document.createElement("div");
    roiBlock.className = "deal-roi-block";
    const roiMain = document.createElement("div");
    roiMain.className = "deal-roi-main";
    roiMain.textContent = roiStr;
    const roiLabel = document.createElement("div");
    roiLabel.className = "deal-roi-label";
    roiLabel.textContent = "без плечей";
    roiBlock.appendChild(roiMain);
    roiBlock.appendChild(roiLabel);

    header.appendChild(symbolEl);
    header.appendChild(roiBlock);
    left.appendChild(header);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    ["Параметр", "Bybit", "Binance"].forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    function addRow(paramName, bybitVal, binanceVal, rowClass) {
      const tr = document.createElement("tr");
      if (rowClass) tr.className = rowClass;
      const tdName = document.createElement("td");
      tdName.className = "param-name";
      tdName.textContent = paramName;

      const tdBybit = document.createElement("td");
      tdBybit.textContent = bybitVal ?? "";

      const tdBinance = document.createElement("td");
      tdBinance.textContent = binanceVal ?? "";

      tr.appendChild(tdName);
      tr.appendChild(tdBybit);
      tr.appendChild(tdBinance);
      tbody.appendChild(tr);
    }

    function addSharedRow(paramName, value, rowClass) {
      const tr = document.createElement("tr");
      if (rowClass) tr.className = rowClass;
      const tdName = document.createElement("td");
      tdName.className = "param-name";
      tdName.textContent = paramName;

      const tdValue = document.createElement("td");
      tdValue.colSpan = 2;
      tdValue.textContent = value ?? "";

      tr.appendChild(tdName);
      tr.appendChild(tdValue);
      tbody.appendChild(tr);
    }

    const qty = deal.qty ?? "";
    const sideBybit = deal.bybit_side ?? "";
    const sideBinance = deal.binance_side ?? "";
    const openISO = deal.open_datetime ?? "";
    const closeISO = deal.close_datetime ?? "";
    const openStr = formatDateTimeISO(openISO);
    const closeStr = formatDateTimeISO(closeISO);
    const bybitEntryPrice = formatPrice6(deal.bybit_entry_price);
    const binanceEntryPrice = formatPrice6(deal.binance_entry_price);
    const bybitExitPrice = formatPrice6(deal.bybit_exit_price);
    const binanceExitPrice = formatPrice6(deal.binance_exit_price);
    const minutesInDeal = durationMinutes(deal.duration_ms);

    const bybitPricePnl = formatMoney(deal.bybit_price_pnl, 2);
    const binancePricePnl = formatMoney(deal.binance_price_pnl, 2);
    const bybitCommission = formatMoneyWithMinus(deal.bybit_commission, 2);
    const binanceCommission = formatMoneyWithMinus(deal.binance_commission, 2);
    const bybitFunding = formatMoney(deal.bybit_funding, 2);
    const binanceFunding = formatMoney(deal.binance_funding, 2);
    const bybitResult = formatMoney(deal.bybit_result, 2);
    const binanceResult = formatMoney(deal.binance_result, 2);

    const capital = formatMoney(deal.overall_position, 2);
    const overallResult = formatMoney(deal.overall_result, 2);

    addRow("Объем", qty, qty);
    addRow("Направление", sideBybit, sideBinance);
    addSharedRow("Дата и время входа", openStr);
    addRow("Средняя цена входа", bybitEntryPrice, binanceEntryPrice);
    addSharedRow("Дата и время выхода", closeStr);
    addRow("Средняя цена выхода", bybitExitPrice, binanceExitPrice);
    addSharedRow("Время в сделке, минут", minutesInDeal);

    addRow("Прибыль от разницы цен, USDT", bybitPricePnl, binancePricePnl);
    addRow("Комиссии, USDT", bybitCommission, binanceCommission);
    addRow("Фандинг, USDT", bybitFunding, binanceFunding);
    addRow("Результат по бирже, USDT", bybitResult, binanceResult);

    const trCap = document.createElement("tr");
    trCap.className = "overall-row";
    const tdCapName = document.createElement("td");
    tdCapName.className = "param-name";
    tdCapName.textContent = "Размер позиции, USDT";
    const tdCapVal = document.createElement("td");
    tdCapVal.colSpan = 2;
    tdCapVal.className = "emphasis-value";
    tdCapVal.textContent = capital;
    trCap.appendChild(tdCapName);
    trCap.appendChild(tdCapVal);
    tbody.appendChild(trCap);

    const trOverall = document.createElement("tr");
    trOverall.className = "overall-row";
    const tdNameOverall = document.createElement("td");
    tdNameOverall.className = "param-name";
    tdNameOverall.textContent = "Общий результат, USDT";
    const tdOverallValue = document.createElement("td");
    tdOverallValue.colSpan = 2;
    tdOverallValue.className = "emphasis-value";
    tdOverallValue.textContent = overallResult;
    trOverall.appendChild(tdNameOverall);
    trOverall.appendChild(tdOverallValue);
    tbody.appendChild(trOverall);

    table.appendChild(tbody);
    left.appendChild(table);

    const chartContainer = document.createElement("div");
    const chartTitle = document.createElement("div");
    chartTitle.style.fontSize = "14px";
    chartTitle.style.color = "#e5e7eb";
    chartTitle.style.marginBottom = "6px";
    chartTitle.style.textAlign = "center";
    chartTitle.textContent = `Спред   Binance: ${deal.symbol} / Bybit: ${deal.symbol}`;
    right.appendChild(chartTitle);

    chartContainer.className = "chart-container";
    right.appendChild(chartContainer);

    const spreadCandles = (window.arbDealSpreads || {})[deal.id] || [];
    if (!spreadCandles.length) {
      const msg = document.createElement("div");
      msg.className = "no-data";
      msg.textContent = "Нет данных по спреду для этой сделки.";
      chartContainer.appendChild(msg);
    }

    slide.appendChild(left);
    slide.appendChild(right);
    slidesWrapper.appendChild(slide);

    const slideIndexLocal = slideItems.length;
    tabBtn.addEventListener("click", () => {
      currentIndex = slideIndexLocal;
      ym(105484818,'reachGoal','deals-switch');
      updateSlider();
    });

    slideItems.push({
      slide,
      chartContainer,
      deal,
      chartInitialized: false,
      chart: null,
      series: null,
    });
    tabButtons.push(tabBtn);
  });

  let currentIndex = 0;

  function updateTabsActive() {
    tabButtons.forEach((btn, idx) => {
      if (idx === currentIndex) btn.classList.add("active");
      else btn.classList.remove("active");
    });
  }

  function initChartForIndex(index) {
    const item = slideItems[index];
    if (!item || item.chartInitialized) return;

    const spreadCandles = (window.arbDealSpreads || {})[item.deal.id] || [];
    if (!spreadCandles.length) {
      item.chartInitialized = true;
      return;
    }

    const chart = LightweightCharts.createChart(item.chartContainer, {
      layout: {
        background: { type: "solid", color: "#000000" },
        textColor: "#e5e7eb",
      },
      grid: {
        vertLines: { color: "rgba(51, 65, 85, 0.6)" },
        horzLines: { color: "rgba(51, 65, 85, 0.6)" },
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.5)",
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
          if (typeof time === "string") return time;
          const d = new Date(time * 1000);
          const hh = String(d.getUTCHours()).padStart(2, "0");
          const mm = String(d.getUTCMinutes()).padStart(2, "0");
          return `${hh}:${mm}`;
        },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.5)",
      },
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
      localization: {
        priceFormatter: (price) => price.toFixed(4),
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "rgba(37, 99, 235, 0.0)",
      borderUpColor: "rgba(59, 130, 246, 0.95)",
      wickUpColor: "rgba(0, 0, 0, 0)",
      downColor: "rgba(30, 64, 175, 0.75)",
      borderDownColor: "rgba(37, 99, 235, 0.95)",
      wickDownColor: "rgba(0, 0, 0, 0)",
    });

    series.applyOptions({
      lastValueVisible: false,
      priceLineVisible: false,
    });

    series.setData(spreadCandles);

    series.createPriceLine({
      price: 1.0,
      color: "#9ca3af",
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      axisLabelVisible: false,
      title: "",
    });

    const markers = buildMarkers(spreadCandles, item.deal);
    if (markers.length) {
      series.setMarkers(markers);
    }

    const firstTime = spreadCandles[0].time;
    const lastTime = spreadCandles[spreadCandles.length - 1].time;
    chart.timeScale().setVisibleRange({
      from: firstTime,
      to: lastTime,
    });

    item.chartInitialized = true;
    item.chart = chart;
    item.series = series;
  }

  function updateSlider() {
    const total = slideItems.length || 1;
    slidesWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === total - 1;
    slideIndexLabel.textContent = `${currentIndex + 1} / ${total}`;
    updateTabsActive();
    initChartForIndex(currentIndex);
  }

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      updateSlider();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentIndex < slideItems.length - 1) {
      currentIndex += 1;
      updateSlider();
    }
  });

  if (!slideItems.length) {
    slidesWrapper.innerHTML =
      "<div class='slide'><div class='no-data'>Нет сделок в arbDeals.</div></div>";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    slideIndexLabel.textContent = "0 / 0";
  } else {
    updateSlider();
  }
});
