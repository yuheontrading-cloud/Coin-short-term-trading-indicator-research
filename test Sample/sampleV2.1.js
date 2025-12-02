//@version=5
indicator("바닥/천장 종합 지표 (롱숏 진입)", overlay=true)

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
showSignals = input.bool(true, "진입 신호 표시")

longThreshold = input.int(6, "롱 진입 기준 점수", minval=3, maxval=10)
shortThreshold = input.int(6, "숏 진입 기준 점수", minval=3, maxval=10)

// ========== 이동평균선 계산 ==========
sma25 = ta.sma(close, 25)
sma50 = ta.sma(close, 50)
sma200 = ta.sma(close, 200)
sma400 = ta.sma(close, 400)
vwma100 = ta.vwma(close, 100)

// ========== 캔들 패턴 분석 (바닥) ==========

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
moderateBullishCandle = bullishCandleScore == 1

// ========== 캔들 패턴 분석 (천장) ==========

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
moderateBearishCandle = bearishCandleScore == 1

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

// ========== 지표 계산 (과매도) ==========

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
volumeSignal = volume > volumeMA * 1.5

    [macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9)
macdBullishSignal = macdLine < 0 and histLine > histLine[1]
macdBearishSignal = macdLine > 0 and histLine < histLine[1]

nearSMA200 = close > sma200 * 0.98 and close < sma200 * 1.02
nearSMA400 = close > sma400 * 0.98 and close < sma400 * 1.02
supportSignal = nearSMA200 or nearSMA400
resistanceSignal = nearSMA200 or nearSMA400

// ========== 롱 신호 점수 계산 ==========
longScore = 0
longScore := longScore + (rsiOversoldSignal ? 1 : 0)
longScore := longScore + (stochOversoldSignal ? 1 : 0)
longScore := longScore + (mfiOversoldSignal ? 1 : 0)
longScore := longScore + (bbOversoldSignal ? 1 : 0)
longScore := longScore + (maOversoldSignal ? 1 : 0)
longScore := longScore + (volumeSignal ? 1 : 0)
longScore := longScore + (macdBullishSignal ? 1 : 0)
longScore := longScore + (supportSignal ? 1 : 0)
longScore := longScore + (strongBullishCandle ? 2 : moderateBullishCandle ? 1 : 0)

// ========== 숏 신호 점수 계산 ==========
shortScore = 0
shortScore := shortScore + (rsiOverboughtSignal ? 1 : 0)
shortScore := shortScore + (stochOverboughtSignal ? 1 : 0)
shortScore := shortScore + (mfiOverboughtSignal ? 1 : 0)
shortScore := shortScore + (bbOverboughtSignal ? 1 : 0)
shortScore := shortScore + (maOverboughtSignal ? 1 : 0)
shortScore := shortScore + (volumeSignal ? 1 : 0)
shortScore := shortScore + (macdBearishSignal ? 1 : 0)
shortScore := shortScore + (resistanceSignal ? 1 : 0)
shortScore := shortScore + (strongBearishCandle ? 2 : moderateBearishCandle ? 1 : 0)

// ========== 포지션 진입 신호 ==========

// 롱 진입 조건
longEntryStrong = longScore >= longThreshold and (isDowntrending or isStrongDowntrend)
longEntryModerate = longScore >= longThreshold - 1 and (isUptrending or isNeutral) and strongBullishCandle
longEntry = longEntryStrong or longEntryModerate

// 숏 진입 조건
shortEntryStrong = shortScore >= shortThreshold and (isUptrending or isStrongUptrend)
shortEntryModerate = shortScore >= shortThreshold - 1 and (isDowntrending or isNeutral) and strongBearishCandle
shortEntry = shortEntryStrong or shortEntryModerate

// 진입 신호 필터링 (연속 신호 방지)
var bool inLongPosition = false
var bool inShortPosition = false

if longEntry and not inLongPosition
inLongPosition := true
inShortPosition := false

if shortEntry and not inShortPosition
inShortPosition := true
inLongPosition := false

// 포지션 청산 조건
longExit = (rsi > 70 or close > bbUpper or (isBearishEngulfing or isShootingStar)) and inLongPosition
shortExit = (rsi < 30 or close < bbLower or (isBullishEngulfing or isHammer)) and inShortPosition

if longExit
    inLongPosition := false

if shortExit
    inShortPosition := false

// 새로운 진입 신호 (필터링 후)
newLongEntry = longEntry and not inLongPosition[1]
newShortEntry = shortEntry and not inShortPosition[1]

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

// 추세 배경색
bgcolor(showTrend and isStrongUptrend ? color.new(color.blue, 95) : na)
bgcolor(showTrend and isStrongDowntrend ? color.new(color.red, 95) : na)

// 포지션 진입 구간 배경색
bgcolor(inLongPosition ? color.new(color.green, 90) : na, title="롱 포지션")
bgcolor(inShortPosition ? color.new(color.red, 90) : na, title="숏 포지션")

// 캔들 패턴 표시 (바닥)
plotshape(showCandle and isHammer, "망치형", shape.diamond, location.belowbar,
    color.new(color.lime, 0), text="망치", textcolor=color.black, size=size.tiny)

plotshape(showCandle and isDragonflyDoji, "잠자리도지", shape.diamond, location.belowbar,
    color.new(color.aqua, 0), text="도지", textcolor=color.black, size=size.tiny)

plotshape(showCandle and isBullishEngulfing, "상승장악", shape.diamond, location.belowbar,
    color.new(color.yellow, 0), text="장악", textcolor=color.black, size=size.tiny)

// 캔들 패턴 표시 (천장)
plotshape(showCandle and isShootingStar, "유성형", shape.diamond, location.abovebar,
    color.new(color.red, 0), text="유성", textcolor=color.white, size=size.tiny)

plotshape(showCandle and isGravestoneDoji, "비석도지", shape.diamond, location.abovebar,
    color.new(color.orange, 0), text="비석", textcolor=color.white, size=size.tiny)

plotshape(showCandle and isBearishEngulfing, "하락장악", shape.diamond, location.abovebar,
    color.new(color.purple, 0), text="장악", textcolor=color.white, size=size.tiny)

// 롱 진입 신호
plotshape(showSignals and newLongEntry and longEntryStrong, "강한 롱 진입",
    shape.labelup, location.belowbar, color.new(color.green, 0),
    text="LONG", textcolor=color.white, size=size.normal)

plotshape(showSignals and newLongEntry and longEntryModerate, "중간 롱 진입",
    shape.triangleup, location.belowbar, color.new(color.lime, 0),
    text="", size=size.small)

// 숏 진입 신호
plotshape(showSignals and newShortEntry and shortEntryStrong, "강한 숏 진입",
    shape.labeldown, location.abovebar, color.new(color.red, 0),
    text="SHORT", textcolor=color.white, size=size.normal)

plotshape(showSignals and newShortEntry and shortEntryModerate, "중간 숏 진입",
    shape.triangledown, location.abovebar, color.new(color.orange, 0),
    text="", size=size.small)

// 청산 신호
plotshape(showSignals and longExit, "롱 청산", shape.xcross, location.abovebar,
    color.new(color.red, 0), text="EXIT", textcolor=color.white, size=size.tiny)

plotshape(showSignals and shortExit, "숏 청산", shape.xcross, location.belowbar,
    color.new(color.green, 0), text="EXIT", textcolor=color.white, size=size.tiny)

// ========== 알림 조건 ==========
alertcondition(newLongEntry and longEntryStrong, "강한 롱 진입", "🟢 강한 롱 진입 신호! 점수: {{plot_0}}")
alertcondition(newLongEntry and longEntryModerate, "중간 롱 진입", "🟡 중간 롱 진입 신호!")
alertcondition(newShortEntry and shortEntryStrong, "강한 숏 진입", "🔴 강한 숏 진입 신호! 점수: {{plot_0}}")
alertcondition(newShortEntry and shortEntryModerate, "중간 숏 진입", "🟠 중간 숏 진입 신호!")
alertcondition(longExit, "롱 청산", "❌ 롱 포지션 청산 신호!")
alertcondition(shortExit, "숏 청산", "❌ 숏 포지션 청산 신호!")

// ========== 정보 테이블 ==========
var table infoTable = table.new(position.top_right, 3, 18, bgcolor=color.new(color.black, 80),
    frame_color=color.gray, frame_width=1)

if barstate.islast
    // 현재 포지션 상태
    positionText = inLongPosition ? "롱 진행중" : inShortPosition ? "숏 진행중" : "대기"
positionColor = inLongPosition ? color.new(color.green, 30) : inShortPosition ? color.new(color.red, 30) : color.new(color.gray, 50)

table.cell(infoTable, 0, 0, "포지션", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 1, 0, positionText, text_color=color.white, bgcolor=positionColor)
table.cell(infoTable, 2, 0, "", bgcolor=positionColor)

// 추세 정보
trendText = isStrongUptrend ? "강한상승" : isUptrending ? "상승" : isNeutral ? "중립" : isDowntrending ? "하락" : "강한하락"
trendColorBg = isStrongUptrend or isUptrending ? color.new(color.lime, 30) : isNeutral ? color.new(color.yellow, 30) : color.new(color.red, 30)

table.cell(infoTable, 0, 1, "추세", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 1, 1, trendText, text_color=color.white, bgcolor=trendColorBg)
table.cell(infoTable, 2, 1, str.tostring(trendScore), text_color=color.white, bgcolor=trendColorBg)

// ADX
table.cell(infoTable, 0, 2, "ADX", text_color=color.white)
adxColor = strongTrend ? color.lime : color.gray
table.cell(infoTable, 1, 2, str.tostring(math.round(adx, 1)), text_color=adxColor)
table.cell(infoTable, 2, 2, strongTrend ? "강함" : "약함", text_color=adxColor)

// 구분선
table.cell(infoTable, 0, 3, "----------", text_color=color.gray)
table.cell(infoTable, 1, 3, "----------", text_color=color.gray)
table.cell(infoTable, 2, 3, "----------", text_color=color.gray)

// 롱 신호
table.cell(infoTable, 0, 4, "롱신호", text_color=color.white, bgcolor=color.new(color.green, 50))
table.cell(infoTable, 1, 4, str.tostring(longScore), text_color=color.white, bgcolor=color.new(color.green, 50))
longStatus = longScore >= longThreshold ? "진입!" : longScore >= longThreshold - 1 ? "대기" : "-"
table.cell(infoTable, 2, 4, longStatus, text_color=color.white, bgcolor=color.new(color.green, 50))

// 롱 캔들
longCandleText = isHammer ? "망치" : isDragonflyDoji ? "도지" : isBullishEngulfing ? "장악" : isMorningStar ? "샛별" : "-"
table.cell(infoTable, 0, 5, "롱캔들", text_color=color.white)
table.cell(infoTable, 1, 5, longCandleText, text_color=strongBullishCandle ? color.lime : color.gray)
table.cell(infoTable, 2, 5, str.tostring(bullishCandleScore), text_color=color.white)

// 구분선
table.cell(infoTable, 0, 6, "----------", text_color=color.gray)
table.cell(infoTable, 1, 6, "----------", text_color=color.gray)
table.cell(infoTable, 2, 6, "----------", text_color=color.gray)

// 숏 신호
table.cell(infoTable, 0, 7, "숏신호", text_color=color.white, bgcolor=color.new(color.red, 50))
table.cell(infoTable, 1, 7, str.tostring(shortScore), text_color=color.white, bgcolor=color.new(color.red, 50))
shortStatus = shortScore >= shortThreshold ? "진입!" : shortScore >= shortThreshold - 1 ? "대기" : "-"
table.cell(infoTable, 2, 7, shortStatus, text_color=color.white, bgcolor=color.new(color.red, 50))

// 숏 캔들
shortCandleText = isShootingStar ? "유성" : isGravestoneDoji ? "비석" : isBearishEngulfing ? "장악" : isEveningStar ? "저녁별" : "-"
table.cell(infoTable, 0, 8, "숏캔들", text_color=color.white)
table.cell(infoTable, 1, 8, shortCandleText, text_color=strongBearishCandle ? color.red : color.gray)
table.cell(infoTable, 2, 8, str.tostring(bearishCandleScore), text_color=color.white)

// 구분선
table.cell(infoTable, 0, 9, "----------", text_color=color.gray)
table.cell(infoTable, 1, 9, "----------", text_color=color.gray)
table.cell(infoTable, 2, 9, "----------", text_color=color.gray)

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
table.cell(infoTable, 1, 16, volumeSignal ? "O" : "X", text_color=volumeSignal ? color.lime : color.gray)
table.cell(infoTable, 2, 16, volumeSignal ? "O" : "X", text_color=volumeSignal ? color.red : color.gray)

table.cell(infoTable, 0, 17, "MACD", text_color=color.white)
table.cell(infoTable, 1, 17, macdBullishSignal ? "O" : "X", text_color=macdBullishSignal ? color.lime : color.gray)
table.cell(infoTable, 2, 17, macdBearishSignal ? "O" : "X", text_color=macdBearishSignal ? color.red : color.gray)
