//@version=5
strategy("상세 백테스트", overlay=true, initial_capital=10000000, default_qty_type=strategy.percent_of_equity, default_qty_value=50, commission_value=0.04)

// ========== 백테스트 기간 설정 ==========
startDate = input(timestamp("2023-01-01 00:00"), "시작일", group="백테스트 기간")
endDate = input(timestamp("2024-12-31 23:59"), "종료일", group="백테스트 기간")
inDateRange = true

// ========== 지표 설정 ==========
rsiLength = input.int(14, "RSI 기간")
rsiLow = input.int(30, "과매도")
rsiHigh = input.int(70, "과매수")
bbLength = input.int(20, "볼린저밴드 기간")
bbMult = input.float(2.0, "볼린저밴드 승수")

longStopLoss = input.float(1.5, "롱 손절 %")
longTakeProfit = input.float(2.0, "롱 익절 %")
shortStopLoss = input.float(1.5, "숏 손절 %")
shortTakeProfit = input.float(2.5, "숏 익절 %")

// ========== 지표 계산 ==========
rsi = ta.rsi(close, rsiLength)
basis = ta.sma(close, bbLength)
dev = bbMult * ta.stdev(close, bbLength)
upper = basis + dev
lower = basis - dev

ema20 = ta.ema(close, 20)
ema50 = ta.ema(close, 50)
ema200 = ta.ema(close, 200)

avgVol = ta.sma(volume, 20)
highVol = volume > avgVol * 1.5

    [macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9)

// ========== 추세 판단 ==========
downTrend = close < ema200 and ema20 < ema50
upTrend = close > ema200 and ema20 > ema50

// ========== 롱 시그널 ==========
longCond1 = rsi < rsiLow and close <= lower
longCond2 = ta.crossover(rsi, rsiLow) and highVol
longCond3 = close < lower and close > close[1]
longCond4 = ta.crossover(macdLine, signalLine) and rsi < 45

longEntry = (longCond1 or longCond2 or longCond3 or longCond4) and downTrend

longExitCond = rsi > rsiHigh or close >= upper or ta.crossunder(close, ema20)

// ========== 숏 시그널 ==========
shortCond1 = rsi > rsiHigh and close >= upper
shortCond2 = ta.crossunder(rsi, rsiHigh) and highVol
shortCond3 = close > upper and close < close[1]
shortCond4 = ta.crossunder(macdLine, signalLine) and rsi > 55
shortCond5 = ta.crossunder(close, ema20) and rsi > 60 and downTrend

shortEntry = (shortCond1 or shortCond2 or shortCond3 or shortCond4 or shortCond5)

shortExitCond = rsi < rsiLow or close <= lower or ta.crossover(close, ema20)

// ========== 포지션 관리 ==========
if inDateRange
    // 롱 포지션
    if longEntry and strategy.position_size == 0
strategy.entry("Long", strategy.long)
strategy.exit("LongExit", "Long", stop=close*(1-longStopLoss/100), limit=close*(1+longTakeProfit/100))

if longExitCond and strategy.position_size > 0
strategy.close("Long")

// 숏 포지션
if shortEntry and strategy.position_size == 0
strategy.entry("Short", strategy.short)
strategy.exit("ShortExit", "Short", stop=close*(1+shortStopLoss/100), limit=close*(1-shortTakeProfit/100))

if shortExitCond and strategy.position_size < 0
strategy.close("Short")

// ========== 시각화 ==========
plot(upper, "상단", color.red)
plot(basis, "중간", color.orange)
plot(lower, "하단", color.green)
plot(ema20, "EMA20", color.yellow, 2)
plot(ema200, "EMA200", color.white, 2)

plotshape(longEntry, "롱", shape.triangleup, location.belowbar, color.lime, size=size.normal)
plotshape(shortEntry, "숏", shape.triangledown, location.abovebar, color.red, size=size.normal)

bgcolor(strategy.position_size > 0 ? color.new(color.lime, 90) : strategy.position_size < 0 ? color.new(color.red, 90) : na)

// ========== 성과 테이블 ==========
var table perfTable = table.new(position.bottom_right, 2, 8, border_width=1)

if barstate.islast
    totalTrades = strategy.closedtrades
winTrades = 0
lossTrades = 0
totalProfit = 0.0
totalLoss = 0.0

for i = 0 to totalTrades - 1
profit = strategy.closedtrades.profit(i)
if profit > 0
    winTrades += 1
totalProfit += profit
else
lossTrades += 1
totalLoss += profit

winRate = totalTrades > 0 ? winTrades / totalTrades * 100 : 0
avgWin = winTrades > 0 ? totalProfit / winTrades : 0
avgLoss = lossTrades > 0 ? totalLoss / lossTrades : 0
profitFactor = totalLoss != 0 ? math.abs(totalProfit / totalLoss) : 0

table.cell(perfTable, 0, 0, "항목", bgcolor=color.new(color.gray, 50), text_color=color.white)
table.cell(perfTable, 1, 0, "값", bgcolor=color.new(color.gray, 50), text_color=color.white)

table.cell(perfTable, 0, 1, "총 거래", text_color=color.white)
table.cell(perfTable, 1, 1, str.tostring(totalTrades), text_color=color.white)

table.cell(perfTable, 0, 2, "승률", text_color=color.white)
winColor = winRate >= 50 ? color.lime : color.red
table.cell(perfTable, 1, 2, str.tostring(winRate, "#.##") + "%", text_color=winColor)

table.cell(perfTable, 0, 3, "승/패", text_color=color.white)
table.cell(perfTable, 1, 3, str.tostring(winTrades) + "/" + str.tostring(lossTrades), text_color=color.white)

table.cell(perfTable, 0, 4, "평균 수익", text_color=color.white)
table.cell(perfTable, 1, 4, str.tostring(avgWin, "#,###"), text_color=color.lime)

table.cell(perfTable, 0, 5, "평균 손실", text_color=color.white)
table.cell(perfTable, 1, 5, str.tostring(avgLoss, "#,###"), text_color=color.red)

table.cell(perfTable, 0, 6, "Profit Factor", text_color=color.white)
pfColor = profitFactor >= 1.5 ? color.lime : profitFactor >= 1.0 ? color.yellow : color.red
table.cell(perfTable, 1, 6, str.tostring(profitFactor, "#.##"), text_color=pfColor)

netProfit = strategy.netprofit
returnPct = netProfit / strategy.initial_capital * 100
table.cell(perfTable, 0, 7, "수익률", text_color=color.white)
returnColor = returnPct > 0 ? color.lime : color.red
table.cell(perfTable, 1, 7, str.tostring(returnPct, "#.##") + "%", text_color=returnColor)
