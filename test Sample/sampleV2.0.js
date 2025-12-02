//@version=5
indicator("바닥 구간 종합 지표 (추세+캔들패턴)", overlay=true)

// ========== 입력 설정 ==========
rsiLength = input.int(14, "RSI 기간", minval=1)
rsiOversold = input.int(30, "RSI 과매도 기준", minval=0, maxval=50)

stochLength = input.int(14, "스토캐스틱 기간", minval=1)
stochOversold = input.int(20, "스토캐스틱 과매도 기준", minval=0, maxval=50)

mfiLength = input.int(14, "MFI 기간", minval=1)
mfiOversold = input.int(20, "MFI 과매도 기준", minval=0, maxval=50)

bbLength = input.int(20, "볼린저밴드 기간", minval=1)
bbMult = input.float(2.0, "볼린저밴드 표준편차", minval=0.1)

showMA = input.bool(true, "이동평균선 표시")
showTrend = input.bool(true, "추세 분석 표시")
showCandle = input.bool(true, "캔들 패턴 표시")

// ========== 이동평균선 계산 ==========
sma25 = ta.sma(close, 25)
sma50 = ta.sma(close, 50)
sma200 = ta.sma(close, 200)
sma400 = ta.sma(close, 400)
vwma100 = ta.vwma(close, 100)

// ========== 캔들 패턴 분석 ==========

// 캔들 기본 정보
bodySize = math.abs(close - open)
upperWick = high - math.max(close, open)
lowerWick = math.min(close, open) - low
totalRange = high - low
avgBody = ta.sma(bodySize, 14)

isBullish = close > open
isBearish = close < open

// 1. 망치형 (Hammer) - 강한 바닥 신호
isHammer = isBullish and lowerWick > bodySize * 2 and upperWick < bodySize * 0.3 and bodySize > avgBody * 0.3

// 2. 역망치형 (Inverted Hammer)
isInvertedHammer = isBullish and upperWick > bodySize * 2 and lowerWick < bodySize * 0.3 and bodySize > avgBody * 0.3

// 3. 교수형/유성형이지만 상승 반전 (Hanging Man as reversal)
isHangingManReversal = isBearish and lowerWick > bodySize * 2 and upperWick < bodySize * 0.5

// 4. 도지 (Doji) - 우유부단, 반전 가능
isDoji = bodySize < totalRange * 0.1 and totalRange > 0

// 5. 잠자리 도지 (Dragonfly Doji) - 강한 바닥 신호
isDragonflyDoji = isDoji and lowerWick > totalRange * 0.6 and upperWick < totalRange * 0.1

// 6. 비석 도지 (Gravestone Doji)
isGravestoneDoji = isDoji and upperWick > totalRange * 0.6 and lowerWick < totalRange * 0.1

// 7. 상승 장악형 (Bullish Engulfing)
isBullishEngulfing = isBullish and isBearish[1] and close > open[1] and open < close[1] and bodySize > bodySize[1]

// 8. 샅바형 (Piercing Pattern)
isPiercing = isBullish and isBearish[1] and open < low[1] and close > (open[1] + close[1]) / 2 and close < open[1]

// 9. 샛별형 (Morning Star) - 3봉 패턴
isMorningStar = isBullish and isBearish[2] and bodySize[1] < avgBody * 0.5 and close > (open[2] + close[2]) / 2

// 10. 삼병형 (Three White Soldiers)
isThreeWhiteSoldiers = isBullish and isBullish[1] and isBullish[2] and close > close[1] and close[1] > close[2] and open > open[1] and open[1] > open[2]

// 11. 긴 하락 캔들 후 반등 (Long Red Candle Reversal)
isLongRedReversal = isBullish and isBearish[1] and bodySize[1] > avgBody * 2 and close > open[1]

// 12. 핀바 (Pin Bar) - 긴 꼬리
isPinBar = lowerWick > bodySize * 2 and lowerWick > upperWick * 2

// 13. 트와이저 바텀 (Tweezer Bottom)
isTweezerBottom = math.abs(low - low[1]) < totalRange * 0.02 and isBullish and isBearish[1]

// 캔들 패턴 점수
candleScore = 0
candleScore := candleScore + (isHammer ? 2 : 0)
candleScore := candleScore + (isInvertedHammer ? 1 : 0)
candleScore := candleScore + (isDragonflyDoji ? 2 : 0)
candleScore := candleScore + (isBullishEngulfing ? 2 : 0)
candleScore := candleScore + (isPiercing ? 1 : 0)
candleScore := candleScore + (isMorningStar ? 2 : 0)
candleScore := candleScore + (isThreeWhiteSoldiers ? 2 : 0)
candleScore := candleScore + (isLongRedReversal ? 1 : 0)
candleScore := candleScore + (isPinBar ? 1 : 0)
candleScore := candleScore + (isTweezerBottom ? 1 : 0)

// 강한 캔들 패턴 신호
strongCandlePattern = candleScore >= 2
moderateCandlePattern = candleScore == 1

// ========== 추세 분석 ==========

// 1. 이동평균선 정렬
bullishMA = sma25 > sma50 and sma50 > sma200
bearishMA = sma25 < sma50 and sma50 < sma200

// 2. 가격과 주요 이평선 관계
priceAboveMA = close > sma25 and close > sma50
priceBelowMA = close < sma25 and close < sma50

// 3. 단기 추세
isUptrend = close > ta.sma(close, 20) and close > close[10]
isDowntrend = close < ta.sma(close, 20) and close < close[10]

// 4. ADX 추세 강도
    [diPlus, diMinus, adx] = ta.dmi(14, 14)
strongTrend = adx > 25
trendDirection = diPlus > diMinus ? 1 : -1

// 5. 종합 추세 판단
trendScore = 0
trendScore := trendScore + (bullishMA ? 2 : 0)
trendScore := trendScore + (bearishMA ? -2 : 0)
trendScore := trendScore + (priceAboveMA ? 1 : 0)
trendScore := trendScore + (priceBelowMA ? -1 : 0)
trendScore := trendScore + (isUptrend ? 1 : 0)
trendScore := trendScore + (isDowntrend ? -1 : 0)
trendScore := trendScore + (strongTrend and trendDirection > 0 ? 1 : 0)
trendScore := trendScore + (strongTrend and trendDirection < 0 ? -1 : 0)

// 추세 상태
isStrongUptrend = trendScore >= 3
isUptrending = trendScore >= 1 and trendScore < 3
isNeutral = trendScore > -1 and trendScore < 1
isDowntrending = trendScore <= -1 and trendScore > -3
isStrongDowntrend = trendScore <= -3

// ========== 지표 계산 ==========

// 1. RSI
rsi = ta.rsi(close, rsiLength)
rsiSignal = rsi < rsiOversold

// 2. 스토캐스틱
k = ta.sma(ta.stoch(close, high, low, stochLength), 3)
d = ta.sma(k, 3)
stochSignal = k < stochOversold

// 3. MFI
mfi = ta.mfi(close, mfiLength)
mfiSignal = mfi < mfiOversold

// 4. 볼린저 밴드
bbBasis = ta.sma(close, bbLength)
bbDev = bbMult * ta.stdev(close, bbLength)
bbLower = bbBasis - bbDev
bbUpper = bbBasis + bbDev
bbSignal = close < bbLower

// 5. 이동평균선
maSignal = close < sma25 and close < sma50 and close < vwma100

// 6. 거래량
volumeMA = ta.sma(volume, 20)
volumeSignal = volume > volumeMA * 1.5

// 7. MACD
    [macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9)
macdSignal = macdLine < 0 and histLine > histLine[1]

// 8. 장기 이평선 지지
nearSMA200 = close > sma200 * 0.98 and close < sma200 * 1.02
nearSMA400 = close > sma400 * 0.98 and close < sma400 * 1.02
supportSignal = nearSMA200 or nearSMA400

// ========== 신호 점수 계산 ==========
oversoldScore = 0
oversoldScore := oversoldScore + (rsiSignal ? 1 : 0)
oversoldScore := oversoldScore + (stochSignal ? 1 : 0)
oversoldScore := oversoldScore + (mfiSignal ? 1 : 0)
oversoldScore := oversoldScore + (bbSignal ? 1 : 0)
oversoldScore := oversoldScore + (maSignal ? 1 : 0)
oversoldScore := oversoldScore + (volumeSignal ? 1 : 0)
oversoldScore := oversoldScore + (macdSignal ? 1 : 0)
oversoldScore := oversoldScore + (supportSignal ? 1 : 0)

// 캔들 패턴 가중치 추가
totalScore = oversoldScore + (strongCandlePattern ? 2 : moderateCandlePattern ? 1 : 0)

// ========== 바닥 구간 판단 (캔들 패턴 포함) ==========

// 하락 추세에서의 바닥 신호
bottomInDowntrend = (isDowntrending or isStrongDowntrend) and (oversoldScore >= 5 or (oversoldScore >= 4 and strongCandlePattern))

// 상승 추세에서의 바닥 신호
bottomInUptrend = (isUptrending or isStrongUptrend) and (oversoldScore >= 3 or (oversoldScore >= 2 and strongCandlePattern))

// 중립 추세에서의 바닥 신호
bottomInNeutral = isNeutral and (oversoldScore >= 4 or (oversoldScore >= 3 and strongCandlePattern))

// 종합 바닥 신호
strongBottom = bottomInDowntrend or (bottomInUptrend and totalScore >= 6)
moderateBottom = bottomInNeutral or (bottomInUptrend and totalScore >= 4 and totalScore < 6)
weakBottom = totalScore >= 3 and totalScore < 4 and not isStrongDowntrend

// ========== 시각화 ==========

// 이동평균선 표시
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
bgcolor(showTrend and isStrongUptrend ? color.new(color.blue, 95) : na, title="강한 상승 추세")
bgcolor(showTrend and isStrongDowntrend ? color.new(color.red, 95) : na, title="강한 하락 추세")

// 바닥 구간 배경색
bgColorDown = bottomInDowntrend ? color.new(color.lime, 70) : na
bgColorUp = strongBottom and (isUptrending or isStrongUptrend) ? color.new(color.aqua, 70) : na
bgcolor(bgColorDown, title="하락 추세 강한 바닥")
bgcolor(bgColorUp, title="상승 추세 강한 바닥")
bgcolor(moderateBottom ? color.new(color.yellow, 80) : na, title="중간 바닥")
bgcolor(weakBottom ? color.new(color.orange, 85) : na, title="약한 바닥")

// 캔들 패턴 표시
plotshape(showCandle and isHammer, "망치형", shape.diamond, location.belowbar,
    color.new(color.lime, 0), text="망치", textcolor=color.black, size=size.tiny)

plotshape(showCandle and isDragonflyDoji, "잠자리도지", shape.diamond, location.belowbar,
    color.new(color.aqua, 0), text="도지", textcolor=color.black, size=size.tiny)

plotshape(showCandle and isBullishEngulfing, "상승장악", shape.diamond, location.belowbar,
    color.new(color.yellow, 0), text="장악", textcolor=color.black, size=size.tiny)

plotshape(showCandle and isMorningStar, "샛별형", shape.diamond, location.belowbar,
    color.new(color.orange, 0), text="샛별", textcolor=color.black, size=size.tiny)

plotshape(showCandle and isPinBar, "핀바", shape.diamond, location.belowbar,
    color.new(color.purple, 0), text="핀바", textcolor=color.white, size=size.tiny)

// 바닥 신호 표시
labelColorDown = color.new(color.lime, 0)
labelColorUp = color.new(color.aqua, 0)

plotshape(bottomInDowntrend, "하락추세 강한 바닥", shape.labelup, location.belowbar,
    labelColorDown, text="하락바닥", textcolor=color.black, size=size.small)

plotshape(strongBottom and (isUptrending or isStrongUptrend), "상승추세 조정 바닥",
    shape.labelup, location.belowbar, labelColorUp, text="상승조정",
    textcolor=color.black, size=size.small)

plotshape(moderateBottom, "중간 바닥 신호", shape.triangleup, location.belowbar,
    color.new(color.yellow, 0), text="", size=size.tiny)

// ========== 알림 조건 ==========
alertcondition(strongBottom, "강한 바닥 신호", "강한 바닥 구간 진입!")
alertcondition(bottomInDowntrend, "하락추세 바닥 신호", "하락 추세에서 강한 바닥 신호!")
alertcondition(bottomInUptrend, "상승추세 조정 바닥", "상승 추세 조정 후 바닥 신호!")
alertcondition(strongCandlePattern, "강한 캔들 패턴", "강한 반전 캔들 패턴 발생!")

// ========== 정보 테이블 ==========
var table infoTable = table.new(position.top_right, 2, 16, bgcolor=color.new(color.black, 80),
    frame_color=color.gray, frame_width=1)

if barstate.islast
    // 추세 정보
    trendText = isStrongUptrend ? "강한상승" : isUptrending ? "상승" : isNeutral ? "중립" : isDowntrending ? "하락" : "강한하락"

trendColorBg = isStrongUptrend or isUptrending ? color.new(color.lime, 30) : isNeutral ? color.new(color.yellow, 30) : color.new(color.red, 30)

table.cell(infoTable, 0, 0, "현재추세", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 1, 0, trendText, text_color=color.white, bgcolor=trendColorBg)

table.cell(infoTable, 0, 1, "추세점수", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 1, 1, str.tostring(trendScore), text_color=color.white, bgcolor=trendColorBg)

table.cell(infoTable, 0, 2, "ADX", text_color=color.white)
adxColor = strongTrend ? color.lime : color.gray
table.cell(infoTable, 1, 2, str.tostring(math.round(adx, 1)), text_color=adxColor)

// 구분선
table.cell(infoTable, 0, 3, "----------", text_color=color.gray)
table.cell(infoTable, 1, 3, "----------", text_color=color.gray)

// 캔들 패턴
table.cell(infoTable, 0, 4, "캔들패턴", text_color=color.white, bgcolor=color.new(color.purple, 50))
candleText = isHammer ? "망치" : isDragonflyDoji ? "도지" : isBullishEngulfing ? "장악" : isMorningStar ? "샛별" : isPinBar ? "핀바" : "-"
candleColor = strongCandlePattern ? color.lime : moderateCandlePattern ? color.yellow : color.gray
table.cell(infoTable, 1, 4, candleText, text_color=candleColor, bgcolor=color.new(color.purple, 50))

table.cell(infoTable, 0, 5, "캔들점수", text_color=color.white, bgcolor=color.new(color.purple, 50))
table.cell(infoTable, 1, 5, str.tostring(candleScore), text_color=color.white, bgcolor=color.new(color.purple, 50))

// 구분선
table.cell(infoTable, 0, 6, "----------", text_color=color.gray)
table.cell(infoTable, 1, 6, "----------", text_color=color.gray)

// 지표 신호
table.cell(infoTable, 0, 7, "지표", text_color=color.white, bgcolor=color.new(color.gray, 50))
table.cell(infoTable, 1, 7, "신호", text_color=color.white, bgcolor=color.new(color.gray, 50))

table.cell(infoTable, 0, 8, "RSI", text_color=color.white)
table.cell(infoTable, 1, 8, rsiSignal ? "O" : "X", text_color=rsiSignal ? color.lime : color.red)

table.cell(infoTable, 0, 9, "Stoch", text_color=color.white)
table.cell(infoTable, 1, 9, stochSignal ? "O" : "X", text_color=stochSignal ? color.lime : color.red)

table.cell(infoTable, 0, 10, "MFI", text_color=color.white)
table.cell(infoTable, 1, 10, mfiSignal ? "O" : "X", text_color=mfiSignal ? color.lime : color.red)

table.cell(infoTable, 0, 11, "BB", text_color=color.white)
table.cell(infoTable, 1, 11, bbSignal ? "O" : "X", text_color=bbSignal ? color.lime : color.red)

table.cell(infoTable, 0, 12, "MA", text_color=color.white)
table.cell(infoTable, 1, 12, maSignal ? "O" : "X", text_color=maSignal ? color.lime : color.red)

table.cell(infoTable, 0, 13, "Vol", text_color=color.white)
table.cell(infoTable, 1, 13, volumeSignal ? "O" : "X", text_color=volumeSignal ? color.lime : color.red)

table.cell(infoTable, 0, 14, "MACD", text_color=color.white)
table.cell(infoTable, 1, 14, macdSignal ? "O" : "X", text_color=macdSignal ? color.lime : color.red)

table.cell(infoTable, 0, 15, "총점수", text_color=color.white, bgcolor=color.new(color.blue, 50))
scoreText = str.tostring(totalScore) + "/10"
table.cell(infoTable, 1, 15, scoreText, text_color=color.white, bgcolor=color.new(color.blue, 50))
