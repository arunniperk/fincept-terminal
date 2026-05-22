export function calcReturns(prices) {
  if (!prices || prices.length < 2) return [];
  const out = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1]?.close ?? prices[i - 1];
    const cur = prices[i]?.close ?? prices[i];
    if (prev && cur && prev > 0) out.push((cur - prev) / prev);
  }
  return out;
}

export function mean(arr) {
  if (!arr?.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function variance(arr, sample = true) {
  if (!arr?.length) return 0;
  const mu = mean(arr);
  const sq = arr.reduce((s, v) => s + (v - mu) ** 2, 0);
  return sample ? sq / (arr.length - 1) : sq / arr.length;
}

export function stddev(arr, sample = true) {
  return Math.sqrt(variance(arr, sample));
}

export function covariance(arr1, arr2, sample = true) {
  if (!arr1?.length || arr1.length !== arr2?.length) return 0;
  const mu1 = mean(arr1), mu2 = mean(arr2);
  const cov = arr1.reduce((s, v, i) => s + (v - mu1) * (arr2[i] - mu2), 0);
  return sample ? cov / (arr1.length - 1) : cov / arr1.length;
}

export function correlation(arr1, arr2) {
  const cov = covariance(arr1, arr2);
  const sd1 = stddev(arr1), sd2 = stddev(arr2);
  if (!sd1 || !sd2) return 0;
  return cov / (sd1 * sd2);
}

export function annualizedReturn(dailyReturns, tradingDays = 252) {
  const mu = mean(dailyReturns);
  return (1 + mu) ** tradingDays - 1;
}

export function annualizedVol(dailyReturns, tradingDays = 252) {
  return stddev(dailyReturns) * Math.sqrt(tradingDays);
}

export function sharpeRatio(dailyReturns, riskFreeRate = 0.065) {
  const annRet = annualizedReturn(dailyReturns);
  const annVol = annualizedVol(dailyReturns);
  if (!annVol) return 0;
  return (annRet - riskFreeRate) / annVol;
}

export function sortinoRatio(dailyReturns, riskFreeRate = 0.065, tradingDays = 252) {
  const annRet = annualizedReturn(dailyReturns);
  const downside = dailyReturns.filter(r => r < 0);
  if (!downside.length) return annRet - riskFreeRate > 0 ? Infinity : 0;
  const downDev = Math.sqrt(downside.reduce((s, v) => s + v * v, 0) / downside.length) * Math.sqrt(tradingDays);
  if (!downDev) return 0;
  return (annRet - riskFreeRate) / downDev;
}

export function maxDrawdown(prices) {
  if (!prices?.length) return { drawdown: 0, peakIdx: -1, troughIdx: -1 };
  let peak = prices[0]?.close ?? prices[0];
  let peakIdx = 0;
  let maxDd = 0, troughIdx = 0;
  for (let i = 1; i < prices.length; i++) {
    const v = prices[i]?.close ?? prices[i];
    if (v > peak) { peak = v; peakIdx = i; }
    const dd = (peak - v) / peak;
    if (dd > maxDd) { maxDd = dd; troughIdx = i; }
  }
  return { drawdown: maxDd, peakIdx, troughIdx };
}

export function varHistorical(returns, confidence = 0.95) {
  if (!returns?.length) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.floor((1 - confidence) * sorted.length);
  return sorted[Math.min(idx, sorted.length - 1)];
}

export function cvarHistorical(returns, confidence = 0.95) {
  if (!returns?.length) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.floor((1 - confidence) * sorted.length);
  const tail = sorted.slice(0, Math.max(idx, 1));
  return mean(tail);
}

export function beta(stockReturns, marketReturns) {
  const cov = covariance(stockReturns, marketReturns);
  const mktVar = variance(marketReturns);
  if (!mktVar) return 0;
  return cov / mktVar;
}

export function alpha(stockReturns, marketReturns, riskFreeRate = 0.065, tradingDays = 252) {
  const b = beta(stockReturns, marketReturns);
  const rfrDaily = (1 + riskFreeRate) ** (1 / tradingDays) - 1;
  const excessStock = mean(stockReturns) - rfrDaily;
  const excessMkt = mean(marketReturns) - rfrDaily;
  const dailyAlpha = excessStock - b * excessMkt;
  return (1 + dailyAlpha) ** tradingDays - 1;
}

export function correlationMatrix(returnSeries) {
  const n = returnSeries.length;
  const mat = Array.from({ length: n }, () => Array(n).fill(1));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const corr = correlation(returnSeries[i], returnSeries[j]);
      mat[i][j] = corr;
      mat[j][i] = corr;
    }
  }
  return mat;
}

export function portfolioVariance(weights, covMatrix) {
  let var_ = 0;
  const n = weights.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      var_ += weights[i] * weights[j] * (covMatrix[i]?.[j] ?? 0);
    }
  }
  return var_;
}

export function portfolioStddev(weights, covMatrix) {
  return Math.sqrt(portfolioVariance(weights, covMatrix));
}

export function portfolioReturn(weights, annReturns) {
  return weights.reduce((s, w, i) => s + w * (annReturns[i] || 0), 0);
}

export function portfolioSharpe(weights, annReturns, covMatrix, riskFreeRate = 0.065) {
  const ret = portfolioReturn(weights, annReturns);
  const vol = portfolioStddev(weights, covMatrix);
  if (!vol) return 0;
  return (ret - riskFreeRate) / vol;
}

export function efficientFrontier(annReturns, covMatrix, points = 50) {
  const n = annReturns.length;
  if (n === 0) return [];
  const minRet = Math.min(...annReturns);
  const maxRet = Math.max(...annReturns);
  const frontier = [];
  for (let i = 0; i <= points; i++) {
    const targetRet = minRet + (maxRet - minRet) * (i / points);
    const portfolio = optimizeForReturn(annReturns, covMatrix, targetRet);
    if (portfolio) frontier.push(portfolio);
  }
  return frontier;
}

export function optimizeForReturn(annReturns, covMatrix, targetRet, maxIter = 5000) {
  const n = annReturns.length;
  if (n === 0) return null;
  let best = null;
  let bestVol = Infinity;
  for (let iter = 0; iter < maxIter; iter++) {
    let w = Array.from({ length: n }, () => Math.random());
    const sum = w.reduce((s, v) => s + v, 0);
    w = w.map(v => v / sum);
    const ret = portfolioReturn(w, annReturns);
    if (Math.abs(ret - targetRet) > 0.0005) continue;
    const vol = portfolioStddev(w, covMatrix);
    if (vol < bestVol) { bestVol = vol; best = w.slice(); }
  }
  if (!best) {
    const equal = Array(n).fill(1 / n);
    return { weights: equal, ret: portfolioReturn(equal, annReturns), vol: portfolioStddev(equal, covMatrix), sharpe: portfolioSharpe(equal, annReturns, covMatrix) };
  }
  return { weights: best, ret: targetRet, vol: bestVol, sharpe: portfolioSharpe(best, annReturns, covMatrix) };
}

export function maxSharpePortfolio(annReturns, covMatrix, riskFreeRate = 0.065, trials = 10000) {
  const n = annReturns.length;
  if (n === 0) return null;
  let best = null;
  let bestSharpe = -Infinity;
  for (let iter = 0; iter < trials; iter++) {
    let w = Array.from({ length: n }, () => Math.random());
    const sum = w.reduce((s, v) => s + v, 0);
    w = w.map(v => v / sum);
    const sharpe = portfolioSharpe(w, annReturns, covMatrix, riskFreeRate);
    if (sharpe > bestSharpe) { bestSharpe = sharpe; best = w.slice(); }
  }
  return { weights: best, ret: portfolioReturn(best, annReturns), vol: portfolioStddev(best, covMatrix), sharpe: bestSharpe };
}

export function minVariancePortfolio(annReturns, covMatrix, trials = 10000) {
  const n = annReturns.length;
  if (n === 0) return null;
  let best = null;
  let bestVol = Infinity;
  for (let iter = 0; iter < trials; iter++) {
    let w = Array.from({ length: n }, () => Math.random());
    const sum = w.reduce((s, v) => s + v, 0);
    w = w.map(v => v / sum);
    const vol = portfolioStddev(w, covMatrix);
    if (vol < bestVol) { bestVol = vol; best = w.slice(); }
  }
  return { weights: best, ret: portfolioReturn(best, annReturns), vol: bestVol, sharpe: portfolioSharpe(best, annReturns, covMatrix) };
}

export function rebalanceSuggestions(currentWeights, targetWeights, tolerance = 0.02) {
  const n = Math.min(currentWeights.length, targetWeights.length);
  const trades = [];
  for (let i = 0; i < n; i++) {
    const diff = targetWeights[i] - currentWeights[i];
    if (Math.abs(diff) > tolerance) {
      trades.push({ idx: i, current: currentWeights[i], target: targetWeights[i], diff, action: diff > 0 ? 'buy' : 'sell' });
    }
  }
  return trades;
}

export function portfolioRiskMetrics(returnSeries, prices, riskFreeRate = 0.065) {
  return {
    annReturn: annualizedReturn(returnSeries),
    annVol: annualizedVol(returnSeries),
    sharpe: sharpeRatio(returnSeries, riskFreeRate),
    sortino: sortinoRatio(returnSeries, riskFreeRate),
    maxDrawdown: maxDrawdown(prices).drawdown,
    var95: varHistorical(returnSeries, 0.95),
    var99: varHistorical(returnSeries, 0.99),
    cvar95: cvarHistorical(returnSeries, 0.95),
  };
}
