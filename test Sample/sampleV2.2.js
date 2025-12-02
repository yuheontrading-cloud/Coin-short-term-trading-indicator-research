//@version=5
indicator("완전 자동 매매 시스템 (진입/청산)", overlay=true)

// ========== 입력 설정 ==========
rsiLength = input.int(14, "RSI 기간", minval=1)
rsiOversold = input.int(30, "RSI 과매도 기준", minval=0, maxval=50)
rsiOverbought = input.int(70, "RSI 과매수 기준", minval=50, maxval=100)

stochLength = input.int(14, "스토캐스틱 기간", minval=1)
stochOversold = input.int(20, "스토캐스틱 과매도 기준", minval=0, maxval=50)
stochOverbought = input.int(80, "스토캐스틱 과매수 기준", minval=50, maxval=100)

mfiLength = input.int(14, "MFI 기간", minval=1)
mfiOversold = input.int(20, "MFI 과매도 기준", minval=0, maxval=50)
mfiOverbought = input.int(80, "MFI 과매수 기준", minval=50, maxval=100)

bbLength = input.int(20, "볼린저밴드 기간", minval=1)
bbMult = input.float(2.0, "볼린저밴드 표준편차", minval=0.1)

showMA = input.bool(true, "이동평균선 표시")
showTrend = input.bool(true, "추세 분석 표시")
showCandle = input.bool(true, "캔들 패턴 표시")
showSignals = input.bool(true, "진입/청산 신호 표시")

longEntryThreshold = input.int(6, "롱 진입 기준 점수", minval=3, maxval=10)
longExitThreshold = input.int(5, "롱 청산 기준 점수", minval=3, maxval=10)
shortEntryThreshold = input.int(6, "숏 진입 기준 점수", minval=3, maxval=10)
shortExitThreshold = input.int(5, "숏 청산 기준 점수", minval=3, maxval=10)

useTakeProfit = input.bool(true, "목표가 사용")
takeProfitPercent = input.float(5.0, "목표가 (%)", minval=1.0, maxval=50.0)
useStopLoss = input.bool(true, "손절가 사용")
stopLossPercent = input.float(3.0, "손절가 (%)", minval=1.0, maxval=20.0)

useTrailingStop = input.bool(true, "트레일링 스탑 사용")
trailingStopPercent = input.float(2.0, "트레일링 스탑 (%)", minval=0.5, maxval=10.0)

// ========== 이동평균선 계산 ==========
sma25 = ta.sma(close, 25)
sma50 = ta.sma(close, 50)
sma200 = ta.sma(close, 200)
sma400 = ta.sma(close, 400)
vwma100 = ta.vwma(close, 100)

// ========== 캔들 패턴 분석 ==========

bodySize = math.abs(close - open)
upperWick = high - math.max(close, open)
lowerWick = math.min(close, open) - low
totalRange = high - low
avgBody = ta.sma(bodySize, 14)

isBullish = close > open
isBearish = close < open

// 바닥 캔들 패턴
isHammer = isBullish and lowerWick > bodySize * 2 and upperWick < bodySize * 0.3 and bodySize > avgBody * 0.3
isInvertedHammer = isBullish and upperWick > bodySize * 2 and lowerWick < bodySize * 0.3 and bodySize > avgBody * 0.3
isDoji = bodySize < totalRange * 0.1 and totalRange > 0
isDragonflyDoji = isDoji and lowerWick > totalRange * 0.6 and upperWick < totalRange * 0.1
isBullishEngulfing = isBullish and isBearish[1] and close > open[1] and open < close[1] and bodySize > bodySize[1]
isPiercing = isBullish and isBearish[1] and open < low[1] and close > (open[1] + close[1]) / 2 and close < open[1]
isMorningStar = isBullish and isBearish[2] and bodySize[1] < avgBody * 0.5 and close > (open[2] + close[2]) / 2
isThreeWhiteSoldiers = isBullish and isBullish[1] and isBullish[2] and close > close[1] and close[1] > close[2]
isPinBar = lowerWick > bodySize * 2 and lowerWick > upperWick * 2
isTweezerBottom = math.abs(low - low[1]) < totalRange * 0.02 and isBullish and isBearish[1]

bullishCandleScore = 0
bullishCandleScore := bullishCandleScore + (isHammer ? 2 : 0)
bullishCandleScore := bullishCandleScore + (isInvertedHammer ? 1 : 0)
bullishCandleScore := bullishCandleScore + (isDragonflyDoji ? 2 : 0)
bullishCandleScore := bullishCandleScore + (isBullishEngulfing ? 2 : 0)
bullishCandleScore := bullishCandleScore + (isPiercing ? 1 : 0)
bullishCandleScore := bullishCandleScore + (isMorningStar ? 2 : 0)
bullishCandleScore := bullishCandleScore + (isThreeWhiteSoldiers ? 2 : 0)
bullishCandleScore := bullishCandleScore + (isPinBar ? 1 : 0)
bullishCandleScore := bullishCandleScore + (isTweezerBottom ? 1 : 0)

strongBullishCandle = bullishCandleScore >= 2

// 천장 캔들 패턴
isShootingStar = isBearish and upperWick > bodySize * 2 and lowerWick < bodySize * 0.3 and bodySize > avgBody * 0.3
isHangingMan = isBearish and lowerWick > bodySize * 2 and upperWick < bodySize * 0.3
isGravestoneDoji = isDoji and upperWick > totalRange * 0.6 and lowerWick < totalRange * 0.1
isBearishEngulfing = isBearish and isBullish[1] and close < open[1] and open > close[1] and bodySize > bodySize[1]
isDarkCloudCover = isBearish and isBullish[1] and open > high[1] and close < (open[1] + close[1]) / 2 and close > open[1]
isEveningStar = isBearish and isBullish[2] and bodySize[1] < avgBody * 0.5 and close < (open[2] + close[2]) / 2
isThreeBlackCrows = isBearish and isBearish[1] and isBearish[2] and close < close[1] and close[1] < close[2]
isInvertedPinBar = upperWick > bodySize * 2 and upperWick > lowerWick * 2
isTweezerTop = math.abs(high - high[1]) < totalRange * 0.02 and isBearish and isBullish[1]

bearishCandleScore = 0
bearishCandleScore := bearishCandleScore + (isShootingStar ? 2 : 0)
bearishCandleScore := bearishCandleScore + (isHangingMan ? 1 : 0)
bearishCandleScore := bearishCandleScore + (isGravestoneDoji ? 2 : 0)
bearishCandleScore := bearishCandleScore + (isBearishEngulfing ? 2 : 0)
bearishCandleScore := bearishCandleScore + (isDarkCloudCover ? 1 : 0)
bearishCandleScore := bearishCandleScore + (isEveningStar ? 2 : 0)
bearishCandleScore := bearishCandleScore + (isThreeBlackCrows ? 2 : 0)
bearishCandleScore := bearishCandleScore + (isInvertedPinBar ? 1 : 0)
bearishCandleScore := bearishCandleScore + (isTweezerTop ? 1 : 0)

strongBearishCandle = bearishCandleScore >= 2

// ========== 추세 분석 ==========

bullishMA = sma25 > sma50 and sma50 > sma200
bearishMA = sma25 < sma50 and sma50 < sma200

priceAboveMA = close > sma25 and close > sma50
priceBelowMA = close < sma25 and close < sma50

isUptrend = close > ta.sma(close, 20) and close > close[10]
isDowntrend = close < ta.sma(close, 20) and close < close[10]

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

isStrongUptrend = trendScore >= 3
isUptrending = trendScore >= 1 and trendScore < 3
isNeutral = trendScore > -1 and trendScore < 1
isDowntrending = trendScore <= -1 and trendScore > -3
isStrongDowntrend = trendScore <= -3

// ========== 지표 계산 ==========

rsi = ta.rsi(close, rsiLength)
rsiOversoldSignal = rsi < rsiOversold
rsiOverboughtSignal = rsi > rsiOverbought

k = ta.sma(ta.stoch(close, high, low, stochLength), 3)
d = ta.sma(k, 3)
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

maOversoldSignal = close < sma25 and close < sma50 and close < vwma100
maOverboughtSignal = close > sma25 and close > sma50 and close > vwma100

volumeMA = ta.sma(volume, 20)
volumeSpike = volume > volumeMA * 1.5
volumeDrying = volume < volumeMA * 0.7

    [macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9)
macdBullishSignal = macdLine < 0 and histLine > histLine[1]
macdBearishSignal = macdLine > 0 and histLine < histLine[1]
macdBullishCross = ta.crossover(macdLine, signalLine)
macdBearishCross = ta.crossunder(macdLine, signalLine)

nearSMA200 = close > sma200 * 0.98 and close < sma200 * 1.02
nearSMA400 = close > sma400 * 0.98 and close < sma400 * 1.02
supportSignal = nearSMA200 or nearSMA400
resistanceSignal = nearSMA200 or nearSMA400

// ========== 롱 진입 점수 ==========
longEntryScore = 0
longEntryScore := longEntryScore + (rsiOversoldSignal ? 1 : 0)
longEntryScore := longEntryScore + (stochOversoldSignal ? 1 : 0)
longEntryScore := longEntryScore + (mfiOversoldSignal ? 1 : 0)
longEntryScore := longEntryScore + (bbOversoldSignal ? 1 : 0)
longEntryScore := longEntryScore + (maOversoldSignal ? 1 : 0)
longEntryScore := longEntryScore + (volumeSpike ? 1 : 0)
longEntryScore := longEntryScore + (macdBullishSignal ? 1 : 0)
longEntryScore := longEntryScore + (supportSignal ? 1 : 0)
longEntryScore := longEntryScore + (strongBullishCandle ? 2 : 0)

// ========== 롱 청산 점수 ==========
longExitScore = 0
longExitScore := longExitScore + (rsiOverboughtSignal ? 2 : 0)
longExitScore := longExitScore + (stochOverboughtSignal ? 1 : 0)
longExitScore := longExitScore + (mfiOverboughtSignal ? 1 : 0)
longExitScore := longExitScore + (bbOverboughtSignal ? 1 : 0)
longExitScore := longExitScore + (strongBearishCandle ? 2 : 0)
longExitScore := longExitScore + (macdBearishCross ? 1 : 0)
longExitScore := longExitScore + (volumeDrying ? 1 : 0)
longExitScore := longExitScore + (close < sma25 ? 1 : 0)

// ========== 숏 진입 점수 ==========
shortEntryScore = 0
shortEntryScore := shortEntryScore + (rsiOverboughtSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (stochOverboughtSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (mfiOverboughtSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (bbOverboughtSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (maOverboughtSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (volumeSpike ? 1 : 0)
shortEntryScore := shortEntryScore + (macdBearishSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (resistanceSignal ? 1 : 0)
shortEntryScore := shortEntryScore + (strongBearishCandle ? 2 : 0)

// ========== 숏 청산 점수 ==========
shortExitScore = 0
shortExitScore := shortExitScore + (rsiOversoldSignal ? 2 : 0)
shortExitScore := shortExitScore + (stochOversoldSignal ? 1 : 0)
shortExitScore := shortExitScore + (mfiOversoldSignal ? 1 : 0)
shortExitScore := shortExitScore + (bbOversoldSignal ? 1 : 0)
shortExitScore := shortExitScore + (strongBullishCandle ? 2 : 0)
shortExitScore := shortExitScore + (macdBullishCross ? 1 : 0)
shortExitScore := shortExitScore + (volumeDrying ? 1 : 0)
shortExitScore := shortExitScore + (close > sma25 ? 1 : 0)

// ========== 포지션 관리 ==========

var bool inLongPosition = false
var bool inShortPosition = false
var float longEntryPrice = 0.0
var float shortEntryPrice = 0.0
var float longHighestPrice = 0.0
var float shortLowestPrice = 0.0

// 롱 진입 조건
longEntryCondition = longEntryScore >= longEntryThreshold and (isDowntrending or isStrongDowntrend or (isNeutral and strongBullishCandle))

// 숏 진입 조건
shortEntryCondition = shortEntryScore >= shortEntryThreshold and (isUptrending or isStrongUptrend or (isNeutral and strongBearishCandle))

// 롱 청산 조건
longTakeProfitHit = useTakeProfit and inLongPosition and close >= longEntryPrice * (1 + takeProfitPercent / 100)
longStopLossHit = useStopLoss and inLongPosition and close <= longEntryPrice * (1 - stopLossPercent / 100)
longTrailingStopHit = useTrailingStop and inLongPosition and close <= longHighestPrice * (1 - trailingStopPercent / 100)
longSignalExit = inLongPosition and longExitScore >= longExitThreshold

longExitCondition = longTakeProfitHit or longStopLossHit or longTrailingStopHit or longSignalExit

// 숏 청산 조건
shortTakeProfitHit = useTakeProfit and inShortPosition and close <= shortEntryPrice * (1 - takeProfitPercent / 100)
shortStopLossHit = useStopLoss and inShortPosition and close >= shortEntryPrice * (1 + stopLossPercent / 100)
shortTrailingStopHit = useTrailingStop and inShortPosition and close >= shortLowestPrice * (1 + trailingStopPercent / 100)
shortSignalExit = inShortPosition and shortExitScore >= shortExitThreshold

shortExitCondition = shortTakeProfitHit or shortStopLossHit or shortTrailingStopHit or shortSignalExit

// 포지션 상태 업데이트
if longEntryCondition and not inLongPosition and not inShortPosition
inLongPosition := true
longEntryPrice := close
longHighestPrice := close

if shortEntryCondition and not inShortPosition and not inLongPosition
inShortPosition := true
shortEntryPrice := close
shortLowestPrice := close

if inLongPosition
    longHighestPrice := math.max(longHighestPrice, high)

if inShortPosition
    shortLowestPrice := math.min(shortLowestPrice, low)

if longExitCondition
    inLongPosition := false
longEntryPrice := 0.0
longHighestPrice := 0.0

if shortExitCondition
    inShortPosition := false
shortEntryPrice := 0.0
shortLowestPrice := 0.0

// 새로운 신호 감지
newLongEntry = longEntryCondition and not inLongPosition[1]
newShortEntry = shortEntryCondition and not inShortPosition[1]
newLongExit = longExitCondition and inLongPosition[1]
newShortExit = shortExitCondition and inShortPosition[1]

// 수익률 계산
longProfitPercent = inLongPosition ? (close - longEntryPrice) / longEntryPrice * 100 : 0.0
shortProfitPercent = inShortPosition ? (shortEntryPrice - close) / shortEntryPrice * 100 : 0.0

// ========== 시각화 ==========

// 이동평균선
plot(showMA ? sma25 : na, "SMA25", color=color.new(color.purple, 0), linewidth=2)
plot(showMA ? sma50 : na, "SMA50", color=color.new(color.blue, 0), linewidth=2)
plot(showMA ? sma200 : na, "SMA200", color=color.new(color.orange, 0), linewidth=2)
plot(showMA ? sma400 : na, "SMA400", color=color.new(color.red, 0), linewidth=2)
plot(showMA ? vwma100 : na, "VWMA100", color=color.new(color.green, 0), linewidth=2, style=plot.style_circles)

// 볼린저 밴드
p1 = plot(bbUpper, "BB 상단", color=color.new(color.gray, 50), linewidth=1)
p2 = plot(bbLower, "BB 하단", color=color.new(color.gray, 50), linewidth=1)
fill(p1, p2, color=color.new(color.gray, 90))

// 진입가 라인
plot(inLongPosition ? longEntryPrice : na, "롱 진입가", color=color.new(color.blue, 0), linewidth=2, style=plot.style_linebr)
plot(inShortPosition ? shortEntryPrice : na, "숏 진입가", color=color.new(color.orange, 0), linewidth=2, style=plot.style_linebr)

// 목표가/손절가 라인
plot(inLongPosition and useTakeProfit ? longEntryPrice * (1 + takeProfitPercent / 100) : na, "롱 목표가",
    color=color.new(color.green, 0), linewidth=1, style=plot.style_linebr)
plot(inLongPosition and useStopLoss ? longEntryPrice * (1 - stopLossPercent / 100) : na, "롱 손절가",
    color=color.new(color.red, 0), linewidth=1, style=plot.style_linebr)

plot(inShortPosition and useTakeProfit ? shortEntryPrice * (1 - takeProfitPercent / 100) : na, "숏 목표가",
    color=color.new(color.green, 0), linewidth=1, style=plot.style_linebr)
plot(inShortPosition and useStopLoss ? shortEntryPrice * (1 + stopLossPercent / 100) : na, "숏 손절가",
    color=color.new(color.red, 0), linewidth=1, style=plot.style_linebr)

// 트레일링 스탑 라인
plot(inLongPosition and useTrailingStop ? longHighestPrice * (1 - trailingStopPercent / 100) : na, "롱 트레일링",
    color=color.new(color.yellow, 0), linewidth=1, style=plot.style_linebr)
plot(inShortPosition and useTrailingStop ? shortLowestPrice * (1 + trailingStopPercent / 100) : na, "숏 트레일링",
    color=color.new(color.yellow, 0), linewidth=1, style=plot.style_linebr)

// 추세 배경색
bgcolor(showTrend and isStrongUptrend ? color.new(color.blue, 95) : na)
bgcolor(showTrend and isStrongDowntrend ? color.new(color.red, 95) : na)

// 포지션 배경색
bgcolor(inLongPosition ? color.new(color.green, 92) : na, title="롱 포지션")
bgcolor(inShortPosition ? color.new(color.red, 92) : na, title="숏 포지션")

// 캔들 패턴 표시
plotshape(showCandle and isHammer, "망치", shape.diamond, location.belowbar,
    color.new(color.lime, 0), text="망치", textcolor=color.black, size=size.tiny)
plotshape(showCandle and isBullishEngulfing, "상승장악", shape.diamond, location.belowbar,
    color.new(color.yellow, 0), text="장악", textcolor=color.black, size=size.tiny)
plotshape(showCandle and isShootingStar, "유성", shape.diamond, location.abovebar,
    color.new(color.red, 0), text="유성", textcolor=color.white, size=size.tiny)
plotshape(showCandle and isBearishEngulfing, "하락장악", shape.diamond, location.abovebar,
    color.new(color.purple, 0), text="장악", textcolor=color.white, size=size.tiny)

// 롱 진입 신호
plotshape(showSignals and newLongEntry, "롱 진입", shape.labelup, location.belowbar,
    color.new(color.green, 0), text="BUY", textcolor=color.white, size=size.normal)

// 롱 청산 신호 (각 조건별로 분리)
plotshape(showSignals and newLongExit and longTakeProfitHit, "롱 익절", shape.labeldown, location.abovebar,
    color.new(color.lime, 0), text="익절", textcolor=color.black, size=size.normal)

plotshape(showSignals and newLongExit and longStopLossHit, "롱 손절", shape.labeldown, location.abovebar,
    color.new(color.red, 0), text="손절", textcolor=color.white, size=size.normal)

plotshape(showSignals and newLongExit and longTrailingStopHit and not longTakeProfitHit and not longStopLossHit,
    "롱 트레일링", shape.labeldown, location.abovebar,
    color.new(color.orange, 0), text="트레일", textcolor=color.white, size=size.normal)

plotshape(showSignals and newLongExit and longSignalExit and not longTakeProfitHit and not longStopLossHit and not longTrailingStopHit,
    "롱 신호청산", shape.labeldown, location.abovebar,
    color.new(color.yellow, 0), text="신호", textcolor=color.black, size=size.normal)

// 숏 진입 신호
plotshape(showSignals and newShortEntry, "숏 진입", shape.labeldown, location.abovebar,
    color.new(color.red, 0), text="SELL", textcolor=color.white, size=size.normal)

// 숏 청산 신호 (각 조건별로 분리)
plotshape(showSignals and newShortExit and shortTakeProfitHit, "숏 익절", shape.labelup, location.belowbar,
    color.new(color.lime, 0), text="익절", textcolor=color.black, size=size.normal)

plotshape(showSignals and newShortExit and shortStopLossHit, "숏 손절", shape.labelup, location.belowbar,
    color.new(color.red, 0), text="손절", textcolor=color.white, size=size.normal)

plotshape(showSignals and newShortExit and shortTrailingStopHit and not shortTakeProfitHit and not shortStopLossHit,
    "숏 트레일링", shape.labelup, location.belowbar,
    color.new(color.orange, 0), text="트레일", textcolor=color.white, size=size.normal)

plotshape(showSignals and newShortExit and shortSignalExit and not shortTakeProfitHit and not shortStopLossHit and not shortTrailingStopHit,
    "숏 신호청산", shape.labelup, location.belowbar,
    color.new(color.yellow, 0), text="신호", textcolor=color.black, size=size.normal)

// ========== 알림 조건 ==========
alertcondition(newLongEntry, "롱 진입", "🟢 롱 매수 진입!")
alertcondition(newLongExit and longTakeProfitHit, "롱 익절", "💚 롱 익절 성공!")
alertcondition(newLongExit and longStopLossHit, "롱 손절", "💔 롱 손절!")
alertcondition(newLongExit and longTrailingStopHit, "롱 트레일링", "🟡 롱 트레일링 스탑!")
alertcondition(newLongExit and longSignalExit, "롱 신호청산", "🟠 롱 신호 청산!")

alertcondition(newShortEntry, "숏 진입", "🔴 숏 매도 진입!")
alertcondition(newShortExit and shortTakeProfitHit, "숏 익절", "💚 숏 익절 성공!")
alertcondition(newShortExit and shortStopLossHit, "숏 손절", "💔 숏 손절!")
alertcondition(newShortExit and shortTrailingStopHit, "숏 트레일링", "🟡 숏 트레일링 스탑!")
alertcondition(newShortExit and shortSignalExit, "숏 신호청산", "🟠 숏 신호 청산!")

// ========== 정보 테이블 ==========
var table infoTable = table.new(position.top_right, 3, 22, bgcolor=color.new(color.black, 85),
    frame_color=color.gray, frame_width=2)

if barstate.islast
    // 현재 포지션 상태
    positionText = inLongPosition ? "롱진행" : inShortPosition ? "숏진행" : "대기"
positionColor = inLongPosition ? color.new(color.green, 20) : inShortPosition ? color.new(color.red, 20) : color.new(color.gray, 50)

table.cell(infoTable, 0, 0, "포지션", text_color=color.white, bgcolor=color.new(color.gray, 30))
table.cell(infoTable, 1, 0, positionText, text_color=color.white, bgcolor=positionColor)
table.cell(infoTable, 2, 0, "", bgcolor=positionColor)

// 진입가 및 수익률
if inLongPosition
    table.cell(infoTable, 0, 1, "진입가", text_color=color.white)
table.cell(infoTable, 1, 1, str.tostring(longEntryPrice, format.mintick), text_color=color.white)
profitColor = longProfitPercent > 0 ? color.lime : color.red
table.cell(infoTable, 2, 1, str.tostring(longProfitPercent, "#.##") + "%", text_color=profitColor)

table.cell(infoTable, 0, 2, "최고가", text_color=color.white)
table.cell(infoTable, 1, 2, str.tostring(longHighestPrice, format.mintick), text_color=color.yellow)
table.cell(infoTable, 2, 2, "", text_color=color.white)
else if inShortPosition
    table.cell(infoTable, 0, 1, "진입가", text_color=color.white)
table.cell(infoTable, 1, 1, str.tostring(shortEntryPrice, format.mintick), text_color=color.white)
profitColor = shortProfitPercent > 0 ? color.lime : color.red
table.cell(infoTable, 2, 1, str.tostring(shortProfitPercent, "#.##") + "%", text_color=profitColor)

table.cell(infoTable, 0, 2, "최저가", text_color=color.white)
table.cell(infoTable, 1, 2, str.tostring(shortLowestPrice, format.mintick), text_color=color.yellow)
table.cell(infoTable, 2, 2, "", text_color=color.white)
else
table.cell(infoTable, 0, 1, "진입가", text_color=color.gray)
table.cell(infoTable, 1, 1, "-", text_color=color.gray)
table.cell(infoTable, 2, 1, "-", text_color=color.gray)

table.cell(infoTable, 0, 2, "수익률", text_color=color.gray)
table.cell(infoTable, 1, 2, "-", text_color=color.gray)
table.cell(infoTable, 2, 2, "-", text_color=color.gray)

// 구분선
table.cell(infoTable, 0, 3, "-----", text_color=color.gray)
table.cell(infoTable, 1, 3, "-----", text_color=color.gray)
table.cell(infoTable, 2, 3, "-----", text_color=color.gray)

// 추세 정보
trendText = isStrongUptrend ? "강상승" : isUptrending ? "상승" : isNeutral ? "중립" : isDowntrending ? "하락" : "강하락"
trendColorBg = isStrongUptrend or isUptrending ? color.new(color.lime, 30) : isNeutral ? color.new(color.yellow, 30) : color.new(color.red, 30)

table.cell(infoTable, 0, 4, "추세", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 1, 4, trendText, text_color=color.white, bgcolor=trendColorBg)
table.cell(infoTable, 2, 4, str.tostring(trendScore), text_color=color.white, bgcolor=trendColorBg)

// 구분선
table.cell(infoTable, 0, 5, "-----", text_color=color.gray)
table.cell(infoTable, 1, 5, "-----", text_color=color.gray)
table.cell(infoTable, 2, 5, "-----", text_color=color.gray)

// 신호 점수
table.cell(infoTable, 0, 6, "구분", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 1, 6, "진입", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 2, 6, "청산", text_color=color.white, bgcolor=color.new(color.gray, 50))

table.cell(infoTable, 0, 7, "롱", text_color=color.white, bgcolor=color.new(color.green, 50))
longEntryText = str.tostring(longEntryScore) + "/" + str.tostring(longEntryThreshold)
table.cell(infoTable, 1, 7, longEntryText, text_color=color.white, bgcolor=color.new(color.green, 50))
longExitText = inLongPosition ? str.tostring(longExitScore) + "/" + str.tostring(longExitThreshold) : "-"
table.cell(infoTable, 2, 7, longExitText, text_color=color.white, bgcolor=color.new(color.green, 50))

table.cell(infoTable, 0, 8, "숏", text_color=color.white, bgcolor=color.new(color.red, 50))
shortEntryText = str.tostring(shortEntryScore) + "/" + str.tostring(shortEntryThreshold)
table.cell(infoTable, 1, 8, shortEntryText, text_color=color.white, bgcolor=color.new(color.red, 50))
shortExitText = inShortPosition ? str.tostring(shortExitScore) + "/" + str.tostring(shortExitThreshold) : "-"
table.cell(infoTable, 2, 8, shortExitText, text_color=color.white, bgcolor=color.new(color.red, 50))

// 구분선
table.cell(infoTable, 0, 9, "-----", text_color=color.gray)
table.cell(infoTable, 1, 9, "-----", text_color=color.gray)
table.cell(infoTable, 2, 9, "-----", text_color=color.gray)

// 지표 상세
table.cell(infoTable, 0, 10, "지표", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 1, 10, "롱", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 2, 10, "숏", text_color=color.white, bgcolor=color.new(color.gray, 50))

table.cell(infoTable, 0, 11, "RSI", text_color=color.white)
table.cell(infoTable, 1, 11, rsiOversoldSignal ? "O" : "X", text_color=rsiOversoldSignal ? color.lime : color.gray)
table.cell(infoTable, 2, 11, rsiOverboughtSignal ? "O" : "X", text_color=rsiOverboughtSignal ? color.red : color.gray)

table.cell(infoTable, 0, 12, "Stoch", text_color=color.white)
table.cell(infoTable, 1, 12, stochOversoldSignal ? "O" : "X", text_color=stochOversoldSignal ? color.lime : color.gray)
table.cell(infoTable, 2, 12, stochOverboughtSignal ? "O" : "X", text_color=stochOverboughtSignal ? color.red : color.gray)

table.cell(infoTable, 0, 13, "MFI", text_color=color.white)
table.cell(infoTable, 1, 13, mfiOversoldSignal ? "O" : "X", text_color=mfiOversoldSignal ? color.lime : color.gray)
table.cell(infoTable, 2, 13, mfiOverboughtSignal ? "O" : "X", text_color=mfiOverboughtSignal ? color.red : color.gray)

table.cell(infoTable, 0, 14, "BB", text_color=color.white)
table.cell(infoTable, 1, 14, bbOversoldSignal ? "O" : "X", text_color=bbOversoldSignal ? color.lime : color.gray)
table.cell(infoTable, 2, 14, bbOverboughtSignal ? "O" : "X", text_color=bbOverboughtSignal ? color.red : color.gray)

table.cell(infoTable, 0, 15, "MA", text_color=color.white)
table.cell(infoTable, 1, 15, maOversoldSignal ? "O" : "X", text_color=maOversoldSignal ? color.lime : color.gray)
table.cell(infoTable, 2, 15, maOverboughtSignal ? "O" : "X", text_color=maOverboughtSignal ? color.red : color.gray)

table.cell(infoTable, 0, 16, "Vol", text_color=color.white)
table.cell(infoTable, 1, 16, volumeSpike ? "O" : "X", text_color=volumeSpike ? color.lime : color.gray)
table.cell(infoTable, 2, 16, volumeSpike ? "O" : "X", text_color=volumeSpike ? color.red : color.gray)

table.cell(infoTable, 0, 17, "MACD", text_color=color.white)
table.cell(infoTable, 1, 17, macdBullishSignal ? "O" : "X", text_color=macdBullishSignal ? color.lime : color.gray)
table.cell(infoTable, 2, 17, macdBearishSignal ? "O" : "X", text_color=macdBearishSignal ? color.red : color.gray)

// 구분선
table.cell(infoTable, 0, 18, "-----", text_color=color.gray)
table.cell(infoTable, 1, 18, "-----", text_color=color.gray)
table.cell(infoTable, 2, 18, "-----", text_color=color.gray)

// 청산 조건 상태
table.cell(infoTable, 0, 19, "청산", text_color=color.white, bgcolor=color.new(color.orange, 50))
table.cell(infoTable, 1, 19, "익/손", text_color=color.white, bgcolor=color.new(color.orange, 50))
table.cell(infoTable, 2, 19, "트레일", text_color=color.white, bgcolor=color.new(color.orange, 50))

if inLongPosition
    tpslText = (useTakeProfit ? "익O" : "익X") + "/" + (useStopLoss ? "손O" : "손X")
tsText = useTrailingStop ? "O" : "X"
table.cell(infoTable, 1, 20, tpslText, text_color=color.white, text_size=size.small)
table.cell(infoTable, 2, 20, tsText, text_color=color.white)
else if inShortPosition
    tpslText = (useTakeProfit ? "익O" : "익X") + "/" + (useStopLoss ? "손O" : "손X")
tsText = useTrailingStop ? "O" : "X"
table.cell(infoTable, 1, 20, tpslText, text_color=color.white, text_size=size.small)
table.cell(infoTable, 2, 20, tsText, text_color=color.white)
else
table.cell(infoTable, 1, 20, "-", text_color=color.gray)
table.cell(infoTable, 2, 20, "-", text_color=color.gray)

table.cell(infoTable, 0, 20, "설정", text_color=color.white)

// 설정값 표시
table.cell(infoTable, 0, 21, "목표", text_color=color.white)
table.cell(infoTable, 1, 21, str.tostring(takeProfitPercent, "#.#") + "%", text_color=color.lime, text_size=size.small)
table.cell(infoTable, 2, 21, str.tostring(stopLossPercent, "#.#") + "%", text_color=color.red, text_size=size.small)
