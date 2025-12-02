//@version=5
indicator("완전 자동 매매 신호 시스템", overlay=true, max_labels_count=500)

// ========== 입력 설정 ==========
rsiLength = input.int(14, "RSI 기간", minval=1)
rsiOversold = input.int(30, "RSI 과매도", minval=0, maxval=50)
rsiOverbought = input.int(70, "RSI 과매수", minval=50, maxval=100)

stochLength = input.int(14, "스토캐스틱 기간", minval=1)
stochOversold = input.int(20, "스토캐스틱 과매도", minval=0, maxval=50)
stochOverbought = input.int(80, "스토캐스틱 과매수", minval=50, maxval=100)

mfiLength = input.int(14, "MFI 기간", minval=1)
mfiOversold = input.int(20, "MFI 과매도", minval=0, maxval=50)
mfiOverbought = input.int(80, "MFI 과매수", minval=50, maxval=100)

bbLength = input.int(20, "볼린저밴드 기간", minval=1)
bbMult = input.float(2.0, "볼린저밴드 표준편차", minval=0.1)

showMA = input.bool(true, "이동평균선 표시")
showSignals = input.bool(true, "진입/청산 신호")

longEntryThreshold = input.int(6, "롱 진입 점수", minval=3, maxval=12)
longExitThreshold = input.int(5, "롱 청산 점수", minval=3, maxval=10)
shortEntryThreshold = input.int(6, "숏 진입 점수", minval=3, maxval=12)
shortExitThreshold = input.int(5, "숏 청산 점수", minval=3, maxval=10)

takeProfitPercent = input.float(5.0, "목표가 (%)", minval=1.0, maxval=50.0)
stopLossPercent = input.float(3.0, "손절가 (%)", minval=1.0, maxval=20.0)
trailingStopPercent = input.float(2.0, "트레일링 (%)", minval=0.5, maxval=10.0)

// ========== 이동평균선 ==========
sma25 = ta.sma(close, 25)
sma50 = ta.sma(close, 50)
sma200 = ta.sma(close, 200)

// ========== 캔들 패턴 ==========
bodySize = math.abs(close - open)
upperWick = high - math.max(close, open)
lowerWick = math.min(close, open) - low
totalRange = high - low
avgBody = ta.sma(bodySize, 14)

isBullish = close > open
isBearish = close < open

isHammer = isBullish and lowerWick > bodySize * 2 and upperWick < bodySize * 0.3 and bodySize > avgBody * 0.3
isBullishEngulfing = isBullish and isBearish[1] and close > open[1] and open < close[1]
strongBullishCandle = isHammer or isBullishEngulfing

isShootingStar = isBearish and upperWick > bodySize * 2 and lowerWick < bodySize * 0.3 and bodySize > avgBody * 0.3
isBearishEngulfing = isBearish and isBullish[1] and close < open[1] and open > close[1]
strongBearishCandle = isShootingStar or isBearishEngulfing

// ========== 추세 분석 ==========
bullishMA = sma25 > sma50 and sma50 > sma200
bearishMA = sma25 < sma50 and sma50 < sma200
priceAboveMA = close > sma25 and close > sma50
priceBelowMA = close < sma25 and close < sma50
isUptrend = close > ta.sma(close, 20)
isDowntrend = close < ta.sma(close, 20)

    [diPlus, diMinus, adx] = ta.dmi(14, 14)
strongTrend = adx > 25
trendDirection = diPlus > diMinus ? 1 : -1

trendScore = 0
trendScore := trendScore + (bullishMA ? 2 : 0)
trendScore := trendScore + (bearishMA ? -2 : 0)
trendScore := trendScore + (priceAboveMA ? 1 : 0)
trendScore := trendScore + (priceBelowMA ? -1 : 0)
trendScore := trendScore + (isUptrend ? 1 : 0)
trendScore := trendScore + (isDowntrend ? -1 : 0)
trendScore := trendScore + (strongTrend and trendDirection > 0 ? 1 : 0)
trendScore := trendScore + (strongTrend and trendDirection < 0 ? -1 : 0)

isStrongDowntrend = trendScore <= -3
isDowntrending = trendScore <= -1 and trendScore > -3
isNeutral = trendScore > -1 and trendScore < 1
isUptrending = trendScore >= 1 and trendScore < 3
isStrongUptrend = trendScore >= 3

// ========== 지표 계산 ==========
rsi = ta.rsi(close, rsiLength)
rsiOversoldSignal = rsi < rsiOversold
rsiOverboughtSignal = rsi > rsiOverbought

k = ta.sma(ta.stoch(close, high, low, stochLength), 3)
stochOversoldSignal = k < stochOversold
stochOverboughtSignal = k > stochOverbought

mfi = ta.mfi(close, mfiLength)
mfiOversoldSignal = mfi < mfiOversold
mfiOverboughtSignal = mfi > mfiOverbought

bbBasis = ta.sma(close, bbLength)
bbDev = bbMult * ta.stdev(close, bbLength)
bbLower = bbBasis - bbDev
bbUpper = bbBasis + bbDev
bbOversoldSignal = close < bbLower
bbOverboughtSignal = close > bbUpper

maOversoldSignal = close < sma25 and close < sma50
maOverboughtSignal = close > sma25 and close > sma50

volumeMA = ta.sma(volume, 20)
volumeSpike = volume > volumeMA * 1.5

    [macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9)
macdBullishSignal = macdLine < 0 and histLine > histLine[1]
macdBearishSignal = macdLine > 0 and histLine < histLine[1]
macdBullishCross = ta.crossover(macdLine, signalLine)
macdBearishCross = ta.crossunder(macdLine, signalLine)

// ========== 진입/청산 점수 ==========
longEntryScore = 0
longEntryScore := longEntryScore + (rsiOversoldSignal ? 1 : 0)
longEntryScore := longEntryScore + (stochOversoldSignal ? 1 : 0)
longEntryScore := longEntryScore + (mfiOversoldSignal ? 1 : 0)
longEntryScore := longEntryScore + (bbOversoldSignal ? 1 : 0)
longEntryScore := longEntryScore + (maOversoldSignal ? 1 : 0)
longEntryScore := longEntryScore + (volumeSpike ? 1 : 0)
longEntryScore := longEntryScore + (macdBullishSignal ? 1 : 0)
longEntryScore := longEntryScore + (strongBullishCandle ? 2 : 0)

longExitScore = 0
longExitScore := longExitScore + (rsiOverboughtSignal ? 2 : 0)
longExitScore := longExitScore + (stochOverboughtSignal ? 1 : 0)
longExitScore := longExitScore + (mfiOverboughtSignal ? 1 : 0)
longExitScore := longExitScore + (bbOverboughtSignal ? 1 : 0)
longExitScore := longExitScore + (strongBearishCandle ? 2 : 0)
longExitScore := longExitScore + (macdBearishCross ? 1 : 0)
longExitScore := longExitScore + (close < sma25 ? 1 : 0)

shortEntryScore = 0
shortEntryScore := shortEntryScore + (rsiOverboughtSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (stochOverboughtSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (mfiOverboughtSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (bbOverboughtSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (maOverboughtSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (volumeSpike ? 1 : 0)
shortEntryScore := shortEntryScore + (macdBearishSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (strongBearishCandle ? 2 : 0)

shortExitScore = 0
shortExitScore := shortExitScore + (rsiOversoldSignal ? 2 : 0)
shortExitScore := shortExitScore + (stochOversoldSignal ? 1 : 0)
shortExitScore := shortExitScore + (mfiOversoldSignal ? 1 : 0)
shortExitScore := shortExitScore + (bbOversoldSignal ? 1 : 0)
shortExitScore := shortExitScore + (strongBullishCandle ? 2 : 0)
shortExitScore := shortExitScore + (macdBullishCross ? 1 : 0)
shortExitScore := shortExitScore + (close > sma25 ? 1 : 0)

// ========== 진입 조건 ==========
longCondition = longEntryScore >= longEntryThreshold and (isDowntrending or isStrongDowntrend or (isNeutral and strongBullishCandle))
shortCondition = shortEntryScore >= shortEntryThreshold and (isUptrending or isStrongUptrend or (isNeutral and strongBearishCandle))

// ========== 포지션 추적 ==========
var bool inLongPosition = false
var bool inShortPosition = false
var float longEntryPrice = 0.0
var float shortEntryPrice = 0.0
var float longHighest = 0.0
var float shortLowest = 999999999.0

// 롱 진입
if longCondition and not inLongPosition and not inShortPosition
inLongPosition := true
longEntryPrice := close
longHighest := close

// 숏 진입
if shortCondition and not inShortPosition and not inLongPosition
inShortPosition := true
shortEntryPrice := close
shortLowest := close

// 최고가/최저가 추적
if inLongPosition
    longHighest := math.max(longHighest, high)

if inShortPosition
    shortLowest := math.min(shortLowest, low)

// 롱 청산 조건
longTPHit = inLongPosition and close >= longEntryPrice * (1 + takeProfitPercent / 100)
longSLHit = inLongPosition and close <= longEntryPrice * (1 - stopLossPercent / 100)
longTrailHit = inLongPosition and close <= longHighest * (1 - trailingStopPercent / 100)
longSignalExit = inLongPosition and longExitScore >= longExitThreshold

longExit = longTPHit or longSLHit or longTrailHit or longSignalExit

// 숏 청산 조건
shortTPHit = inShortPosition and close <= shortEntryPrice * (1 - takeProfitPercent / 100)
shortSLHit = inShortPosition and close >= shortEntryPrice * (1 + stopLossPercent / 100)
shortTrailHit = inShortPosition and close >= shortLowest * (1 + trailingStopPercent / 100)
shortSignalExit = inShortPosition and shortExitScore >= shortExitThreshold

shortExit = shortTPHit or shortSLHit or shortTrailHit or shortSignalExit

// 청산 실행
if longExit
    inLongPosition := false
longEntryPrice := 0.0
longHighest := 0.0

if shortExit
    inShortPosition := false
shortEntryPrice := 0.0
shortLowest := 999999999.0

// 신호 감지
newLongEntry = longCondition and not inLongPosition[1]
newShortEntry = shortCondition and not inShortPosition[1]
newLongExit = longExit and inLongPosition[1]
newShortExit = shortExit and inShortPosition[1]

// 수익률 계산
longProfit = inLongPosition ? (close - longEntryPrice) / longEntryPrice * 100 : 0.0
shortProfit = inShortPosition ? (shortEntryPrice - close) / shortEntryPrice * 100 : 0.0

// ========== 시각화 ==========
plot(showMA ? sma25 : na, "SMA25", color=color.purple, linewidth=2)
plot(showMA ? sma50 : na, "SMA50", color=color.blue, linewidth=2)
plot(showMA ? sma200 : na, "SMA200", color=color.orange, linewidth=2)

p1 = plot(bbUpper, "BB상단", color=color.gray)
p2 = plot(bbLower, "BB하단", color=color.gray)
fill(p1, p2, color=color.new(color.gray, 90))

// 진입가 라인
plot(inLongPosition ? longEntryPrice : na, "롱진입가", color=color.blue, linewidth=2, style=plot.style_linebr)
plot(inShortPosition ? shortEntryPrice : na, "숏진입가", color=color.orange, linewidth=2, style=plot.style_linebr)

// 목표가/손절가
plot(inLongPosition ? longEntryPrice * (1 + takeProfitPercent / 100) : na, "롱목표", color=color.green, linewidth=1, style=plot.style_linebr)
plot(inLongPosition ? longEntryPrice * (1 - stopLossPercent / 100) : na, "롱손절", color=color.red, linewidth=1, style=plot.style_linebr)
plot(inLongPosition ? longHighest * (1 - trailingStopPercent / 100) : na, "롱트레일", color=color.yellow, linewidth=1, style=plot.style_linebr)

plot(inShortPosition ? shortEntryPrice * (1 - takeProfitPercent / 100) : na, "숏목표", color=color.green, linewidth=1, style=plot.style_linebr)
plot(inShortPosition ? shortEntryPrice * (1 + stopLossPercent / 100) : na, "숏손절", color=color.red, linewidth=1, style=plot.style_linebr)
plot(inShortPosition ? shortLowest * (1 + trailingStopPercent / 100) : na, "숏트레일", color=color.yellow, linewidth=1, style=plot.style_linebr)

bgcolor(isStrongUptrend ? color.new(color.blue, 95) : na)
bgcolor(isStrongDowntrend ? color.new(color.red, 95) : na)
bgcolor(inLongPosition ? color.new(color.green, 92) : na)
bgcolor(inShortPosition ? color.new(color.red, 92) : na)

// 진입 신호
plotshape(showSignals and newLongEntry, "롱진입", shape.labelup, location.belowbar, color.green, text="BUY", textcolor=color.white, size=size.normal)
plotshape(showSignals and newShortEntry, "숏진입", shape.labeldown, location.abovebar, color.red, text="SELL", textcolor=color.white, size=size.normal)

// 청산 신호
plotshape(showSignals and newLongExit and longTPHit, "롱익절", shape.labeldown, location.abovebar, color.lime, text="익절", textcolor=color.black, size=size.normal)
plotshape(showSignals and newLongExit and longSLHit, "롱손절", shape.labeldown, location.abovebar, color.red, text="손절", textcolor=color.white, size=size.normal)
plotshape(showSignals and newLongExit and longTrailHit and not longTPHit and not longSLHit, "롱트레일", shape.labeldown, location.abovebar, color.orange, text="트레일", textcolor=color.white, size=size.normal)
plotshape(showSignals and newLongExit and longSignalExit and not longTPHit and not longSLHit and not longTrailHit, "롱신호", shape.labeldown, location.abovebar, color.yellow, text="신호", textcolor=color.black, size=size.normal)

plotshape(showSignals and newShortExit and shortTPHit, "숏익절", shape.labelup, location.belowbar, color.lime, text="익절", textcolor=color.black, size=size.normal)
plotshape(showSignals and newShortExit and shortSLHit, "숏손절", shape.labelup, location.belowbar, color.red, text="손절", textcolor=color.white, size=size.normal)
plotshape(showSignals and newShortExit and shortTrailHit and not shortTPHit and not shortSLHit, "숏트레일", shape.labelup, location.belowbar, color.orange, text="트레일", textcolor=color.white, size=size.normal)
plotshape(showSignals and newShortExit and shortSignalExit and not shortTPHit and not shortSLHit and not shortTrailHit, "숏신호", shape.labelup, location.belowbar, color.yellow, text="신호", textcolor=color.black, size=size.normal)

// ========== 알림 ==========
alertcondition(newLongEntry, "롱 진입", "🟢 롱 매수 진입!")
alertcondition(newShortEntry, "숏 진입", "🔴 숏 매도 진입!")
alertcondition(newLongExit and longTPHit, "롱 익절", "💚 롱 익절!")
alertcondition(newLongExit and longSLHit, "롱 손절", "💔 롱 손절!")
alertcondition(newShortExit and shortTPHit, "숏 익절", "💚 숏 익절!")
alertcondition(newShortExit and shortSLHit, "숏 손절", "💔 숏 손절!")

// ========== 정보 테이블 ==========
var table infoTable = table.new(position.top_right, 3, 12, bgcolor=color.new(color.black, 85), frame_color=color.gray, frame_width=2)

if barstate.islast
    // 포지션 상태
    posText = inLongPosition ? "롱진행" : inShortPosition ? "숏진행" : "대기"
posColor = inLongPosition ? color.new(color.green, 20) : inShortPosition ? color.new(color.red, 20) : color.new(color.gray, 50)

table.cell(infoTable, 0, 0, "포지션", text_color=color.white, bgcolor=color.new(color.gray, 30))
table.cell(infoTable, 1, 0, posText, text_color=color.white, bgcolor=posColor)
table.cell(infoTable, 2, 0, "", bgcolor=posColor)

// 진입가 및 수익률
if inLongPosition
    table.cell(infoTable, 0, 1, "진입가", text_color=color.white)
table.cell(infoTable, 1, 1, str.tostring(longEntryPrice, format.mintick), text_color=color.white)
profitColor = longProfit > 0 ? color.lime : color.red
table.cell(infoTable, 2, 1, str.tostring(longProfit, "#.##") + "%", text_color=profitColor)
else if inShortPosition
    table.cell(infoTable, 0, 1, "진입가", text_color=color.white)
table.cell(infoTable, 1, 1, str.tostring(shortEntryPrice, format.mintick), text_color=color.white)
profitColor = shortProfit > 0 ? color.lime : color.red
table.cell(infoTable, 2, 1, str.tostring(shortProfit, "#.##") + "%", text_color=profitColor)
else
table.cell(infoTable, 0, 1, "진입가", text_color=color.gray)
table.cell(infoTable, 1, 1, "-", text_color=color.gray)
table.cell(infoTable, 2, 1, "-", text_color=color.gray)

// 구분선
table.cell(infoTable, 0, 2, "-----", text_color=color.gray)
table.cell(infoTable, 1, 2, "-----", text_color=color.gray)
table.cell(infoTable, 2, 2, "-----", text_color=color.gray)

// 신호 점수
table.cell(infoTable, 0, 3, "신호", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 1, 3, "진입", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 2, 3, "청산", text_color=color.white, bgcolor=color.new(color.gray, 50))

table.cell(infoTable, 0, 4, "롱", text_color=color.white, bgcolor=color.new(color.green, 50))
longEntryText = str.tostring(longEntryScore) + "/" + str.tostring(longEntryThreshold)
longEntryColor = longEntryScore >= longEntryThreshold ? color.lime : color.white
table.cell(infoTable, 1, 4, longEntryText, text_color=longEntryColor, bgcolor=color.new(color.green, 50))
longExitText = inLongPosition ? str.tostring(longExitScore) + "/" + str.tostring(longExitThreshold) : "-"
table.cell(infoTable, 2, 4, longExitText, text_color=color.white, bgcolor=color.new(color.green, 50))

table.cell(infoTable, 0, 5, "숏", text_color=color.white, bgcolor=color.new(color.red, 50))
shortEntryText = str.tostring(shortEntryScore) + "/" + str.tostring(shortEntryThreshold)
shortEntryColor = shortEntryScore >= shortEntryThreshold ? color.red : color.white
table.cell(infoTable, 1, 5, shortEntryText, text_color=shortEntryColor, bgcolor=color.new(color.red, 50))
shortExitText = inShortPosition ? str.tostring(shortExitScore) + "/" + str.tostring(shortExitThreshold) : "-"
table.cell(infoTable, 2, 5, shortExitText, text_color=color.white, bgcolor=color.new(color.red, 50))

// 구분선
table.cell(infoTable, 0, 6, "-----", text_color=color.gray)
table.cell(infoTable, 1, 6, "-----", text_color=color.gray)
table.cell(infoTable, 2, 6, "-----", text_color=color.gray)

// 추세
trendText = isStrongUptrend ? "강상승" : isUptrending ? "상승" : isNeutral ? "중립" : isDowntrending ? "하락" : "강하락"
trendColor = isStrongUptrend or isUptrending ? color.lime : isNeutral ? color.yellow : color.red

table.cell(infoTable, 0, 7, "추세", text_color=color.white)
table.cell(infoTable, 1, 7, trendText, text_color=trendColor)
table.cell(infoTable, 2, 7, str.tostring(trendScore), text_color=color.white)

// RSI
table.cell(infoTable, 0, 8, "RSI", text_color=color.white)
rsiColor = rsiOversoldSignal ? color.lime : rsiOverboughtSignal ? color.red : color.white
table.cell(infoTable, 1, 8, str.tostring(math.round(rsi, 1)), text_color=rsiColor)
table.cell(infoTable, 2, 8, "", text_color=color.white)

// 캔들
table.cell(infoTable, 0, 9, "캔들", text_color=color.white)
candleText = strongBullishCandle ? "상승" : strongBearishCandle ? "하락" : "-"
candleColor = strongBullishCandle ? color.lime : strongBearishCandle ? color.red : color.gray
table.cell(infoTable, 1, 9, candleText, text_color=candleColor)
table.cell(infoTable, 2, 9, "", text_color=color.white)

// ADX
table.cell(infoTable, 0, 10, "ADX", text_color=color.white)
adxColor = strongTrend ? color.lime : color.gray
table.cell(infoTable, 1, 10, str.tostring(math.round(adx, 1)), text_color=adxColor)
table.cell(infoTable, 2, 10, strongTrend ? "강함" : "약함", text_color=adxColor)

// 거래량
table.cell(infoTable, 0, 11, "거래량", text_color=color.white)
volColor = volumeSpike ? color.lime : color.gray
table.cell(infoTable, 1, 11, volumeSpike ? "급증" : "보통", text_color=volColor)
table.cell(infoTable, 2, 11, "", text_color=color.white)
